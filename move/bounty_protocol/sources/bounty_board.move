module bounty_protocol::bounty_board {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use std::string::{String};
    use sui::event;
    use std::vector;

    // --- Errors ---
    const ENotOwner: u64 = 0;
    const EInvalidState: u64 = 2;
    const EIndexOutOfBounds: u64 = 3; // Eroare nouă: dacă alegi o soluție care nu există

    // --- Structs ---

    // O structură simplă care ține minte cine și ce a trimis
    public struct Submission has store, copy, drop {
        solver: address,
        link: String,
    }

    #[allow(lint(coin_field))]
    public struct Bounty has key, store {
        id: UID,
        creator: address,
        description: String,
        reward: Coin<SUI>,
        submissions: vector<Submission>, // AICI E SCHIMBAREA: O listă, nu un singur câmp
        winner: Option<address>,         // Cine a câștigat la final (opțional, pentru istoric)
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
            submissions: vector::empty(), // Inițializăm lista goală
            winner: option::none(),
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
        
        // Creăm o nouă "fișă" de soluție
        let submission = Submission {
            solver: ctx.sender(),
            link: solution_link
        };

        // O adăugăm la finalul listei
        vector::push_back(&mut bounty.submissions, submission);
    }

    public fun approve_and_pay(
        bounty: &mut Bounty,
        submission_index: u64, // AICI E SCHIMBAREA: Trebuie să spui PE CARE o plătești
        ctx: &mut TxContext
    ) {
        assert!(ctx.sender() == bounty.creator, ENotOwner);
        assert!(!bounty.is_completed, EInvalidState);
        
        // Verificăm dacă indexul e valid (ex: dacă sunt 3 soluții, indexul poate fi 0, 1 sau 2)
        assert!(submission_index < vector::length(&bounty.submissions), EIndexOutOfBounds);

        // Extragem soluția câștigătoare (fără să o ștergem din listă)
        let winner_submission = vector::borrow(&bounty.submissions, submission_index);
        let solver_addr = winner_submission.solver;

        // Marchez câștigătorul
        bounty.is_completed = true;
        bounty.winner = option::some(solver_addr);
        
        // Plătesc
        let reward_val = coin::value(&bounty.reward);
        let payment = coin::split(&mut bounty.reward, reward_val, ctx);
        transfer::public_transfer(payment, solver_addr);
    }
}