module bounty_protocol::bounty_board {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use std::string::{String};
    use sui::event;
    use std::vector;

    const ENotOwner: u64 = 0;
    const EInvalidState: u64 = 2;
    const EIndexOutOfBounds: u64 = 3;

    public struct Submission has store, copy, drop {
        solver: address,
        link: String,
    }

    #[allow(lint(coin_field))]
    public struct Bounty has key, store {
        id: UID,
        creator: address,
        description: String,
        attachment: Option<String>, // <--- CÂMP NOU: Link către fișier/repo
        reward: Coin<SUI>,
        submissions: vector<Submission>,
        winner: Option<address>,
        is_completed: bool,
    }

    public struct BountyCreated has copy, drop {
        bounty_id: address,
        creator: address,
        reward_amount: u64,
        description: String,
        attachment: Option<String> // <--- Adăugăm și în eveniment
    }

    public fun create_bounty(
        payment: Coin<SUI>, 
        description: String, 
        attachment_url: String, // <--- Parametru nou
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&payment);
        let sender = ctx.sender();
        
        // Transformăm string-ul gol în Option::none
        let attachment_opt = if (std::string::is_empty(&attachment_url)) {
            option::none()
        } else {
            option::some(attachment_url)
        };

        let bounty = Bounty {
            id: object::new(ctx),
            creator: sender,
            description: description,
            attachment: attachment_opt, // <--- Salvăm aici
            reward: payment,
            submissions: vector::empty(),
            winner: option::none(),
            is_completed: false,
        };

        let bounty_id = object::uid_to_address(&bounty.id);
        transfer::share_object(bounty);

        event::emit(BountyCreated {
            bounty_id,
            creator: sender,
            reward_amount: amount,
            description,
            attachment: attachment_opt
        });
    }

    // ... (Restul funcțiilor submit_solution și approve_and_pay RĂMÂN NESCHIMBATE) ...
    public fun submit_solution(bounty: &mut Bounty, solution_link: String, ctx: &mut TxContext) {
        assert!(!bounty.is_completed, EInvalidState);
        let submission = Submission { solver: ctx.sender(), link: solution_link };
        vector::push_back(&mut bounty.submissions, submission);
    }

    public fun approve_and_pay(bounty: &mut Bounty, submission_index: u64, ctx: &mut TxContext) {
        assert!(ctx.sender() == bounty.creator, ENotOwner);
        assert!(!bounty.is_completed, EInvalidState);
        assert!(submission_index < vector::length(&bounty.submissions), EIndexOutOfBounds);

        let winner_submission = vector::borrow(&bounty.submissions, submission_index);
        let solver_addr = winner_submission.solver;

        bounty.is_completed = true;
        bounty.winner = option::some(solver_addr);
        
        let reward_val = coin::value(&bounty.reward);
        let payment = coin::split(&mut bounty.reward, reward_val, ctx);
        transfer::public_transfer(payment, solver_addr);
    }
}