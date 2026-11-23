//! Calagopus Panel extension crate for `io.calagopus.blush`.
//!
//! This theme extension operates purely at the frontend Mantine/Tailwind layer
//! via `frontend/src/index.tsx`, `frontend/src/app.css`, and `frontend/src/boot.html`,
//! preserving all native Calagopus backend routes, permissions, and business logic.

pub const EXTENSION_ID: &str = "io.calagopus.blush";
pub const EXTENSION_VERSION: &str = env!("CARGO_PKG_VERSION");
