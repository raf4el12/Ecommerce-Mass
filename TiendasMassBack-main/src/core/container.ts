import "reflect-metadata";
import { container } from "tsyringe";

/**
 * Global DI container (tsyringe).
 *
 * Empty for now. Phase 3 (DI Wiring) registers the DataSource, repositories,
 * services, and controllers here. `reflect-metadata` must be imported before
 * any decorated class is resolved — keep it as the first import.
 */
export { container };
