module bounty_protocol::bounty_board {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;  // <--- ACEASTA ERA LINIA LIPSĂ
    use std::string::{String};
    use sui::event;

    // --- Errors ---
    const ENotOwner: u64 = 0;
    const EInvalidState: u64 = 2;

    // --- Structs ---
    #[allow(lint(coin_field))]
    public struct Bounty has key, store {
        id: UID,
        creator: address,
        description: String,
        reward: Coin<SUI>,
        solution: Option<String>,
        solver: Option<address>,
        is_completed: bool,
    }

    // --- Events ---
    public struct BountyCreated has copy, drop {
        bounty_id: address,
        creator: address,
        reward_amount: u64,
        description: String
    }

    // --- Functions ---
    public fun create_bounty(
        payment: Coin<SUI>, 
        description: String, 
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&payment);
        let sender = ctx.sender();
        
        let bounty = Bounty {
            id: object::new(ctx),
            creator: sender,
            description: description,
            reward: payment,
            solution: option::none(),
            solver: option::none(),
            is_completed: false,
        };

        let bounty_id = object::uid_to_address(&bounty.id);
        
        transfer::share_object(bounty);

        event::emit(BountyCreated {
            bounty_id,
            creator: sender,
            reward_amount: amount,
            description
        });
    }

    public fun submit_solution(
        bounty: &mut Bounty,
        solution_link: String,
        ctx: &mut TxContext
    ) {
        assert!(!bounty.is_completed, EInvalidState);
        bounty.solution = option::some(solution_link);
        bounty.solver = option::some(ctx.sender());
    }

    public fun approve_and_pay(
        bounty: &mut Bounty,
        ctx: &mut TxContext
    ) {
        assert!(ctx.sender() == bounty.creator, ENotOwner);
        assert!(bounty.solver.is_some(), EInvalidState);
        assert!(!bounty.is_completed, EInvalidState);

        bounty.is_completed = true;
        let solver_addr = *bounty.solver.borrow();
        
        let reward_val = coin::value(&bounty.reward);
        let payment = coin::split(&mut bounty.reward, reward_val, ctx);
        
        transfer::public_transfer(payment, solver_addr);
    }
}