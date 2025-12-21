module attendance_system::subscription {
    use sui::object::Self;
    use sui::clock::{Self, Clock};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::transfer;
    use std::option::{Self, Option};
    use attendance_system::types::{Self as types, AttendanceSystem, AttendanceOrganisation, Subscription};
    use sui::tx_context;
    use attendance_system::constants;
    use attendance_system::events;

    /// Pay subscription fee (10 SUI) to extend subscription by 30 days
    public fun pay_subscription(
        system: &AttendanceSystem,
        org: &mut AttendanceOrganisation,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut sui::tx_context::TxContext,
    ) {
        let payment_amount = coin::value(&payment);
        assert!(payment_amount >= constants::subscription_fee(), constants::e_insufficient_payment());

        let current_timestamp = clock::timestamp_ms(clock);
        
        let new_expiry = if (option::is_some(types::get_subscription(org))) {
            let subscription = option::borrow(types::get_subscription(org));
            let current_expiry = types::get_expiry_timestamp(subscription);
            if (current_expiry > current_timestamp) {
                // Extend from current expiry
                current_expiry + constants::subscription_duration_ms()
            } else {
                // Start from now
                current_timestamp + constants::subscription_duration_ms()
            }
        } else {
            // First subscription
            current_timestamp + constants::subscription_duration_ms()
        };

        if (option::is_none(types::get_subscription(org))) {
            let subscription = types::create_subscription(
                new_expiry,
                payment_amount,
                true,
                ctx,
            );
            option::fill(types::get_subscription_mut(org), subscription);
        } else {
            let subscription = option::borrow_mut(types::get_subscription_mut(org));
            types::set_expiry_timestamp(subscription, new_expiry);
            types::set_payment_amount(subscription, payment_amount);
            types::set_is_active(subscription, true);
        };

        // Transfer payment to system owner (not organization owner)
        transfer::public_transfer(payment, types::get_system_owner(system));

        events::emit_subscription_renewed(
            object::id(org).to_address(),
            new_expiry,
            payment_amount,
        );
    }

    /// Check if subscription is active
    /// Can be called by organisation owner or system owner (server)
    public fun check_subscription_active(
        system: &AttendanceSystem,
        org: &AttendanceOrganisation,
        clock: &Clock,
        ctx: &mut sui::tx_context::TxContext,
    ): bool {
        // Access control: allow organisation owner or system owner (server)
        let caller = sui::tx_context::sender(ctx);
        assert!(types::verify_owner_or_system(org, system, caller), constants::e_unauthorized());
        if (option::is_none(types::get_subscription(org))) {
            return false
        };
        let subscription = option::borrow(types::get_subscription(org));
        let current_timestamp = clock::timestamp_ms(clock);
        types::get_expiry_timestamp(subscription) > current_timestamp && types::get_is_active(subscription)
    }

    /// Get subscription status (for view functions)
    /// Can be called by organisation owner or system owner (server)
    public fun get_subscription_status(
        system: &AttendanceSystem,
        org: &AttendanceOrganisation,
        clock: &Clock,
        ctx: &mut sui::tx_context::TxContext,
    ): (bool, u64, u64) {
        // Access control: allow organisation owner or system owner (server)
        let caller = sui::tx_context::sender(ctx);
        assert!(types::verify_owner_or_system(org, system, caller), constants::e_unauthorized());
        if (option::is_none(types::get_subscription(org))) {
            return (false, 0, 0)
        };
        let subscription = option::borrow(types::get_subscription(org));
        let current_timestamp = clock::timestamp_ms(clock);
        let is_active = types::get_expiry_timestamp(subscription) > current_timestamp && types::get_is_active(subscription);
        (is_active, types::get_expiry_timestamp(subscription), types::get_payment_amount(subscription))
    }
}

