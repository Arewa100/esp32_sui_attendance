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

## Device Management

### Extended Device Health Metrics
- **Status**: Planned
- **Description**: Extend device health tracking beyond heartbeat to include battery capacity, connectivity status, and other health metrics.
- **Technical Considerations**: 
  - Current implementation tracks heartbeat timestamp only
  - Structure designed to be extensible for future metrics (battery, connectivity, uptime, etc.)
  - Will require firmware updates to collect and transmit additional metrics
  - Frontend will need UI enhancements to display comprehensive device health dashboard

## Additional Features

More features will be added here as they are planned and developed.

---

**Note**: This is a living document and will be updated as new features are planned, developed, and released.



