# LiquidFlow Stream Contract Error Codes Reference

This reference documents the error codes returned by the LiquidFlow Soroban stream contract (`contracts/stream_contract/src/lib.rs`). It is designed for frontend developers, backend API integrators, and SDK consumers to translate contract errors into user-friendly error messages and appropriate recovery actions.

---

## Error Codes Table

| Code | Variant Name | Soroban Error Code | Trigger Condition | Recommended User-Facing Message / Remediation |
|---|---|---|---|---|
| `1` | `InvalidAmount` | `Error(Contract, #1)` | - Provided amount is non-positive (`amount <= 0`)<br>- Deposit amount / duration results in zero rate (`rate_per_second == 0`)<br>- Withdrawal request exceeds accrued withdrawable balance | *"Invalid amount. Ensure deposit amount is greater than 0, duration is sufficient to establish a positive stream rate, and withdrawal amounts do not exceed vested balance."* |
| `2` | `StreamNotFound` | `Error(Contract, #2)` | - Stream ID was not found in persistent contract storage | *"Stream not found. Verify the stream ID and ensure the stream was successfully initialized on-chain."* |
| `3` | `Unauthorized` | `Error(Contract, #3)` | - Caller is not the stream recipient on `withdraw_from_stream`<br>- Caller is not the stream sender on `top_up_stream`<br>- Caller is neither sender nor recipient on `cancel_stream` | *"Unauthorized action. Only authorized parties (sender/recipient) can perform this stream operation."* |
| `4` | `StreamInactive` | `Error(Contract, #4)` | - Operation attempted on a stream where `is_active == false` (already cancelled or terminated) | *"This payment stream is no longer active. Inactive or terminated streams cannot accept top-ups or further withdrawals."* |

---

## Integration Guidelines

### Soroban RPC Error Decoding
When invoking the contract through `@stellar/stellar-sdk` or Horizon RPC, contract errors are encapsulated in the transaction simulation or result XDR with error code classification:
- **Contract Error Type**: `ContractError`
- **Error Code Number**: `1`, `2`, `3`, or `4`

```typescript
// Example TypeScript SDK Error Handler
export function parseStreamError(errorCode: number): string {
  switch (errorCode) {
    case 1:
      return "Invalid amount specified. Check minimum rate and withdrawable balance.";
    case 2:
      return "The requested stream does not exist.";
    case 3:
      return "You are not authorized to perform this operation.";
    case 4:
      return "This stream is inactive or has already been completed.";
    default:
      return `Unknown stream error (${errorCode}).`;
  }
}
```

### Backend & API Error Mapping
Backend services (Express / NestJS) catching contract invocation errors should map them to standard HTTP status codes:
- `1` (`InvalidAmount`) -> `400 Bad Request` (`ERR_INVALID_STREAM_AMOUNT`)
- `2` (`StreamNotFound`) -> `404 Not Found` (`ERR_STREAM_NOT_FOUND`)
- `3` (`Unauthorized`) -> `403 Forbidden` (`ERR_UNAUTHORIZED_STREAM_CALLER`)
- `4` (`StreamInactive`) -> `409 Conflict` (`ERR_STREAM_INACTIVE`)
