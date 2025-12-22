# Upcoming Features

This document tracks planned features and improvements for future releases of the ESP32 Sui Attendance System.

## Organisation Management

### Delete Organisation
- **Status**: Planned
- **Description**: Allow organisation owners to permanently delete their organisations and all associated data (students, attendance records, etc.).
- **Technical Considerations**: 
  - Requires careful implementation to handle shared objects in Sui
  - Must ensure data integrity when removing organisations
  - Need to handle cascading deletion of related objects (students, attendance records, subscriptions)
  - Consider archival vs. permanent deletion approach

## Additional Features

More features will be added here as they are planned and developed.

---

**Note**: This is a living document and will be updated as new features are planned, developed, and released.

