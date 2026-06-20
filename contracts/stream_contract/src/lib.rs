#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env, Symbol,
};

#[contracttype]
pub enum DataKey {
    Stream(u64),
    StreamCounter,
}

#[derive(Clone)]
#[contracttype]
pub struct Stream {
    pub sender: Address,
    pub recipient: Address,
    pub token_address: Address,
    pub rate_per_second: i128,
    pub deposited_amount: i128,
    pub withdrawn_amount: i128,
    pub start_time: u64,
    pub last_update_time: u64,
    pub is_active: bool,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum StreamError {
    InvalidAmount = 1,
    StreamNotFound = 2,
    Unauthorized = 3,
    StreamInactive = 4,
}

// Event definitions for indexing
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StreamCreatedEvent {
    pub stream_id: u64,
    pub sender: Address,
    pub recipient: Address,
    pub rate: i128,
    pub token_address: Address,
    pub start_time: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StreamCancelledEvent {
    pub stream_id: u64,
    pub sender: Address,
    pub recipient: Address,
    pub amount_withdrawn: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TokensWithdrawnEvent {
    pub stream_id: u64,
    pub recipient: Address,
    pub amount: i128,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StreamToppedUpEvent {
    pub stream_id: u64,
    pub sender: Address,
    pub amount: i128,
    pub new_deposited_amount: i128,
}

#[contract]
pub struct StreamContract;

#[contractimpl]
impl StreamContract {
    pub fn create_stream(
        env: Env,
        sender: Address,
        recipient: Address,
        token_address: Address,
        amount: i128,
        duration: u64,
    ) -> u64 {
        sender.require_auth();

        let stream_id = Self::get_next_stream_id(&env);
        let start_time = env.ledger().timestamp();
        let rate_per_second = amount / duration as i128;

        // Transfer tokens from sender to contract
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&sender, &env.current_contract_address(), &amount);

        let stream = Stream {
            sender: sender.clone(),
            recipient: recipient.clone(),
            token_address: token_address.clone(),
            rate_per_second,
            deposited_amount: amount,
            withdrawn_amount: 0,
            start_time,
            last_update_time: start_time,
            is_active: true,
        };

        env.storage()
            .persistent()
            .set(&(symbol_short!("STREAMS"), stream_id), &stream);

        // Also store via DataKey for get_stream
        env.storage()
            .instance()
            .set(&DataKey::Stream(stream_id), &stream);

        env.events().publish(
            (Symbol::new(&env, "stream_created"), stream_id),
            StreamCreatedEvent {
                stream_id,
                sender: sender.clone(),
                recipient: recipient.clone(),
                rate: rate_per_second,
                token_address: token_address.clone(),
                start_time,
            },
        );

        stream_id
    }

    fn get_next_stream_id(env: &Env) -> u64 {
        let counter: u64 = env
            .storage()
            .instance()
            .get(&DataKey::StreamCounter)
            .unwrap_or(0);
        let next_id = counter + 1;
        env.storage()
            .instance()
            .set(&DataKey::StreamCounter, &next_id);
        next_id
    }

    pub fn withdraw(env: Env, recipient: Address, stream_id: u64) {
        // Placeholder for withdraw logic
        let _amount: i128 = 0;
        let _timestamp = env.ledger().timestamp();
        let _ = (recipient, stream_id);
    }

    pub fn cancel_stream(env: Env, sender: Address, stream_id: u64) {
        sender.require_auth();
        // Placeholder for cancel logic
        let _amount_withdrawn: i128 = 0;
        let _ = (env, stream_id);
    }

    /// Allows the sender to add more funds to an existing stream
    /// This extends the duration of the stream without creating a new one
    pub fn top_up_stream(
        env: Env,
        sender: Address,
        stream_id: u64,
        amount: i128,
    ) -> Result<(), StreamError> {
        // Require sender authentication
        sender.require_auth();

        // Validate amount is positive
        if amount <= 0 {
            return Err(StreamError::InvalidAmount);
        }

        // Get the stream from storage
        let storage = env.storage().persistent();
        let stream_key = (symbol_short!("STREAMS"), stream_id);

        let mut stream: Stream = match storage.get(&stream_key) {
            Some(s) => s,
            None => return Err(StreamError::StreamNotFound),
        };

        // Verify the caller is the original sender
        if stream.sender != sender {
            return Err(StreamError::Unauthorized);
        }

        // Verify stream is still active
        if !stream.is_active {
            return Err(StreamError::StreamInactive);
        }

        // Transfer tokens from sender to contract
        let token_client = token::Client::new(&env, &stream.token_address);
        let contract_address = env.current_contract_address();
        token_client.transfer(&sender, &contract_address, &amount);

        // Update stream state with additional deposit
        stream.deposited_amount += amount;
        stream.last_update_time = env.ledger().timestamp();

        // Save updated stream back to storage
        storage.set(&stream_key, &stream);

        // Emit StreamToppedUp event
        env.events().publish(
            (Symbol::new(&env, "stream_topped_up"), stream_id),
            StreamToppedUpEvent {
                stream_id,
                sender: sender.clone(),
                amount,
                new_deposited_amount: stream.deposited_amount,
            },
        );

        Ok(())
    }

    pub fn get_stream(env: Env, stream_id: u64) -> Option<Stream> {
        env.storage().instance().get(&DataKey::Stream(stream_id))
    }
}

mod test;
