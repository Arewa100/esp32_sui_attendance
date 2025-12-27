module attendance_system::device {
    use std::string::String;
    use 0x2::table;
    use attendance_system::types::{Self as types, AttendanceSystem, AttendanceOrganisation, RegisterResponse};
    use attendance_system::events;
    use attendance_system::constants;

    /// Register a device for an organisation
    /// Can be called by organisation owner or system owner (server)
    /// Prevents duplicate device IDs across different organisations
    public fun register_device(
        system: &mut AttendanceSystem,
        org: &mut AttendanceOrganisation,
        device_id: String,
        ctx: &mut sui::tx_context::TxContext,
    ): RegisterResponse {
        // Access control: allow organisation owner or system owner (server)
        let caller = sui::tx_context::sender(ctx);
        assert!(types::verify_owner_or_system(org, system, caller), constants::e_unauthorized());

        let org_address = sui::object::id(org).to_address();
        
        // Check global registry: is device already registered to another organisation?
        let device_to_org = types::get_device_to_org(system);
        if (table::contains(device_to_org, device_id)) {
            let existing_org = *table::borrow(device_to_org, device_id);
            // Allow if it's already registered to the same organisation (idempotent)
            assert!(existing_org == org_address, constants::e_device_already_registered());
            // If already registered to this org, return success without modifying state
            return types::create_register_response(std::string::utf8(b"Device already registered to this organisation"))
        };

        // Check if device is already in this organisation's device list (local check)
        let device_ids = types::get_device_ids(org);
        let len = vector::length(device_ids);
        let mut i = 0;
        let mut already_in_org = false;
        
        while (i < len) {
            let device = vector::borrow(device_ids, i);
            if (*device == device_id) {
                already_in_org = true;
                break
            };
            i = i + 1;
        };

        // Add to organisation's device list if not already present
        if (!already_in_org) {
            let device_ids_mut = types::get_device_ids_mut(org);
            vector::push_back(device_ids_mut, device_id);
        };

        // Add to global registry
        let device_to_org_mut = types::get_device_to_org_mut(system);
        table::add(device_to_org_mut, device_id, org_address);

        // Emit event
        events::emit_device_registered(
            org_address,
            device_id,
        );

        types::create_register_response(std::string::utf8(b"Device registered"))
    }

    /// Unregister a device from an organisation
    /// Can be called by organisation owner or system owner (server)
    public fun unregister_device(
        system: &mut AttendanceSystem,
        org: &mut AttendanceOrganisation,
        device_id: String,
        ctx: &mut sui::tx_context::TxContext,
    ): RegisterResponse {
        // Access control: allow organisation owner or system owner (server)
        let caller = sui::tx_context::sender(ctx);
        assert!(types::verify_owner_or_system(org, system, caller), constants::e_unauthorized());

        let org_address = sui::object::id(org).to_address();

        // Verify device is registered to this organisation in global registry
        let device_to_org = types::get_device_to_org(system);
        assert!(table::contains(device_to_org, device_id), constants::e_student_not_found()); // Reuse error for device not found
        let registered_org = *table::borrow(device_to_org, device_id);
        assert!(registered_org == org_address, constants::e_device_already_registered()); // Device belongs to different org

        // Find and remove device from organisation's device list
        let device_ids = types::get_device_ids_mut(org);
        let len = vector::length(device_ids);
        let mut i = 0;
        let mut found = false;
        
        while (i < len) {
            let device = vector::borrow(device_ids, i);
            if (*device == device_id) {
                vector::remove(device_ids, i);
                found = true;
                break
            };
            i = i + 1;
        };

        // Remove heartbeat entry if exists
        if (found) {
            let heartbeats = types::get_device_heartbeats_mut(org);
            if (table::contains(heartbeats, device_id)) {
                table::remove(heartbeats, device_id);
            };
        };

        // Remove from global registry
        let device_to_org_mut = types::get_device_to_org_mut(system);
        table::remove(device_to_org_mut, device_id);

        // Emit event
        events::emit_device_unregistered(
            org_address,
            device_id,
        );

        types::create_register_response(std::string::utf8(b"Device unregistered"))
    }

    /// Update device heartbeat timestamp
    /// Can be called by organisation owner or system owner (server)
    public fun update_device_heartbeat(
        system: &AttendanceSystem,
        org: &mut AttendanceOrganisation,
        device_id: String,
        timestamp: u64,
        ctx: &mut sui::tx_context::TxContext,
    ): RegisterResponse {
        // Access control: allow organisation owner or system owner (server)
        let caller = sui::tx_context::sender(ctx);
        assert!(types::verify_owner_or_system(org, system, caller), constants::e_unauthorized());

        // Check if device is registered
        let device_ids = types::get_device_ids(org);
        let len = vector::length(device_ids);
        let mut i = 0;
        let mut device_registered = false;
        
        while (i < len) {
            let device = vector::borrow(device_ids, i);
            if (*device == device_id) {
                device_registered = true;
                break
            };
            i = i + 1;
        };

        assert!(device_registered, constants::e_student_not_found()); // Reuse error constant for device not found

        // Update heartbeat timestamp
        let heartbeats = types::get_device_heartbeats_mut(org);
        if (table::contains(heartbeats, device_id)) {
            let heartbeat_ref = table::borrow_mut(heartbeats, device_id);
            *heartbeat_ref = timestamp;
        } else {
            table::add(heartbeats, device_id, timestamp);
        };

        // Emit event
        events::emit_device_heartbeat(
            sui::object::id(org).to_address(),
            device_id,
            timestamp,
        );

        types::create_register_response(std::string::utf8(b"Heartbeat updated"))
    }

    /// Check if device is registered for this organisation
    /// Can be called by organisation owner or system owner (server)
    public fun is_device_registered(
        system: &AttendanceSystem,
        org: &AttendanceOrganisation,
        device_id: String,
        ctx: &mut sui::tx_context::TxContext,
    ): bool {
        // Access control: allow organisation owner or system owner (server)
        let caller = sui::tx_context::sender(ctx);
        assert!(types::verify_owner_or_system(org, system, caller), constants::e_unauthorized());

        let device_ids = types::get_device_ids(org);
        let len = vector::length(device_ids);
        let mut i = 0;
        
        while (i < len) {
            let device = vector::borrow(device_ids, i);
            if (*device == device_id) {
                return true
            };
            i = i + 1;
        };

        false
    }

    /// Get device heartbeat timestamp
    /// Can be called by organisation owner or system owner (server)
    public fun get_device_heartbeat(
        system: &AttendanceSystem,
        org: &AttendanceOrganisation,
        device_id: String,
        ctx: &mut sui::tx_context::TxContext,
    ): std::option::Option<u64> {
        // Access control: allow organisation owner or system owner (server)
        let caller = sui::tx_context::sender(ctx);
        assert!(types::verify_owner_or_system(org, system, caller), constants::e_unauthorized());

        let heartbeats = types::get_device_heartbeats(org);
        if (table::contains(heartbeats, device_id)) {
            std::option::some(*table::borrow(heartbeats, device_id))
        } else {
            std::option::none()
        }
    }
}

