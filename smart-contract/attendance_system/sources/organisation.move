module attendance_system::organisation {
    use std::string::String;
    use sui::object::Self;
    use sui::transfer;
    use std::vector;
    use std::option;
    use 0x2::table;
    use attendance_system::types::{Self as types, AttendanceSystem, AttendanceOrganisation, RegisterResponse};
    use attendance_system::events;
    use attendance_system::constants;

    /// Create a new organisation
    public fun create_organisation(
        system: &mut AttendanceSystem,
        name: String,
        ctx: &mut sui::tx_context::TxContext,
    ): RegisterResponse {
        let org = types::create_attendance_organisation(
            name,
            sui::tx_context::sender(ctx),
            vector::empty<address>(),
            table::new<address, vector<address>>(ctx),
            table::new<String, address>(ctx),
            option::none(),
            ctx,
        );
        
        let address_of_organisation: address = object::id(&org).to_address();
        vector::push_back(types::get_organisations_mut(system), address_of_organisation);

        events::emit_organisation_created(
            address_of_organisation,
            *types::get_org_name(&org),
            types::get_org_owner(&org),
        );
        
        // Share the organisation object so server (system owner) can sign transactions
        // Access control is enforced via owner field checks in functions
        sui::transfer::public_share_object(org);

        types::create_register_response(std::string::utf8(b"Organisation created"))
    }

    /// Get number of organisations created
    public fun get_number_of_organisations(system: &AttendanceSystem): u64 {
        vector::length(types::get_organisations(system))
    }

    /// Get organisation owner
    public fun get_org_owner(org: &AttendanceOrganisation): address {
        types::get_org_owner(org)
    }
}

