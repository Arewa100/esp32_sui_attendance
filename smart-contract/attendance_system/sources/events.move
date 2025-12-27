module attendance_system::events {
    use std::string::String;

    public struct OrganisationCreatedEvent has copy, drop {
        organisation: address,
        name: String,
        owner: address,
    }

    public struct StudentRegisteredEvent has copy, drop {
        student: address,
        name: String,
        department: String,
        card_id: String,
        organisation: address,
    }

    public struct AttendanceRecordedEvent has copy, drop {
        record: address,
        student: address,
        timestamp: u64,
        organisation: address,
    }

    public struct SubscriptionRenewedEvent has copy, drop {
        organisation: address,
        expiry_timestamp: u64,
        payment_amount: u64,
    }

    public struct SubscriptionExpiredEvent has copy, drop {
        organisation: address,
    }

    public struct DeviceRegisteredEvent has copy, drop {
        organisation: address,
        device_id: String,
    }

    public struct DeviceUnregisteredEvent has copy, drop {
        organisation: address,
        device_id: String,
    }

    public struct DeviceHeartbeatEvent has copy, drop {
        organisation: address,
        device_id: String,
        timestamp: u64,
    }

    // Helper functions to emit events (events must be emitted from defining module)
    public fun emit_organisation_created(
        organisation: address,
        name: String,
        owner: address
    ) {
        sui::event::emit(OrganisationCreatedEvent {
            organisation,
            name,
            owner,
        });
    }

    public fun emit_student_registered(
        student: address,
        name: String,
        department: String,
        card_id: String,
        organisation: address
    ) {
        sui::event::emit(StudentRegisteredEvent {
            student,
            name,
            department,
            card_id,
            organisation,
        });
    }

    public fun emit_attendance_recorded(
        record: address,
        student: address,
        timestamp: u64,
        organisation: address
    ) {
        sui::event::emit(AttendanceRecordedEvent {
            record,
            student,
            timestamp,
            organisation,
        });
    }

    public fun emit_subscription_renewed(
        organisation: address,
        expiry_timestamp: u64,
        payment_amount: u64
    ) {
        sui::event::emit(SubscriptionRenewedEvent {
            organisation,
            expiry_timestamp,
            payment_amount,
        });
    }

    public fun emit_device_registered(
        organisation: address,
        device_id: String
    ) {
        sui::event::emit(DeviceRegisteredEvent {
            organisation,
            device_id,
        });
    }

    public fun emit_device_unregistered(
        organisation: address,
        device_id: String
    ) {
        sui::event::emit(DeviceUnregisteredEvent {
            organisation,
            device_id,
        });
    }

    public fun emit_device_heartbeat(
        organisation: address,
        device_id: String,
        timestamp: u64
    ) {
        sui::event::emit(DeviceHeartbeatEvent {
            organisation,
            device_id,
            timestamp,
        });
    }
}
