module attendance_system::constants {
    // Subscription constants
    public fun subscription_fee(): u64 { 10000000000 } // 10 SUI in MIST (10 * 10^9)
    public fun subscription_duration_ms(): u64 { 2592000000 } // 30 days in milliseconds

    // Error codes
    public fun e_subscription_expired(): u64 { 1 }
    public fun e_insufficient_payment(): u64 { 2 }
    public fun e_student_not_found(): u64 { 3 }
    public fun e_unauthorized(): u64 { 4 }
    public fun e_duplicate_card_id(): u64 { 5 }
    public fun e_already_checked_in_today(): u64 { 6 }
}
