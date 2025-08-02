# 🔐 Permissions Matrix - Google Meet MCP Server

## 📋 Overview

This comprehensive permissions matrix defines what actions are available to different user roles and under what conditions. Use this as a reference for implementing role-based access control and understanding the security model of the Google Meet MCP Server.

## 🎯 User Role Definitions

### **Executive (C-Level, VP+)**
- **Scope**: Company-wide access with minimal restrictions
- **Business Need**: Strategic oversight, company-wide coordination
- **Security Level**: Highest trust level with audit trails

### **Manager (Director, Team Lead)**
- **Scope**: Team/department-level access with some cross-team capabilities
- **Business Need**: Team coordination, resource management
- **Security Level**: High trust with team-focused permissions

### **Senior Individual Contributor (Senior Engineer, Principal Consultant)**
- **Scope**: Extended personal access with limited team capabilities
- **Business Need**: Technical leadership, cross-team collaboration
- **Security Level**: Medium-high trust with specialized permissions

### **Individual Contributor (Engineer, Analyst, Coordinator)**
- **Scope**: Personal access with basic team participation
- **Business Need**: Personal productivity, team participation
- **Security Level**: Standard trust with personal focus

### **External (Contractor, Client, Partner)**
- **Scope**: Limited access to specific functions only
- **Business Need**: Collaboration on specific projects/meetings
- **Security Level**: Low trust with restricted access

## 📅 Calendar API v3 Permissions

### **calendar_v3_list_calendars**
| Role | Access | Scope | Notes |
|------|--------|-------|-------|
| Executive | ✅ Full | All visible calendars | Can see shared/delegated calendars |
| Manager | ✅ Full | Own + team calendars | Limited to managed teams |
| Senior IC | ✅ Full | Own + shared calendars | Can see calendars shared with them |
| IC | ✅ Full | Own + shared calendars | Personal and explicitly shared only |
| External | ❌ None | - | Must use personal Google account |

### **calendar_v3_create_event**
| Role | Basic Events | With Meet | External Attendees | Company-wide | Recording |
|------|-------------|-----------|-------------------|--------------|-----------|
| Executive | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ | ✅ (with approval) | ❌ | ✅ (team meetings) |
| Senior IC | ✅ | ✅ | ✅ (with approval) | ❌ | ✅ (project meetings) |
| IC | ✅ | ✅ | ⚠️ (limited) | ❌ | ⚠️ (with permission) |
| External | ❌ | ❌ | ❌ | ❌ | ❌ |

**Legend:**
- ✅ = Full access
- ⚠️ = Conditional access (see notes)
- ❌ = No access

### **calendar_v3_update_event**
| Role | Own Events | Team Events | Company Events | External Events |
|------|------------|-------------|----------------|-----------------|
| Executive | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ (if organizer/co-host) | ⚠️ (if invited as co-host) | ❌ |
| Senior IC | ✅ | ⚠️ (if co-host) | ❌ | ❌ |
| IC | ✅ | ❌ | ❌ | ❌ |
| External | ❌ | ❌ | ❌ | ❌ |

### **calendar_v3_delete_event**
| Role | Own Events | Team Events | Company Events |
|------|------------|-------------|----------------|
| Executive | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ (if organizer) | ❌ |
| Senior IC | ✅ | ❌ | ❌ |
| IC | ✅ | ❌ | ❌ |
| External | ❌ | ❌ | ❌ |

### **calendar_v3_freebusy_query**
| Role | Own Calendar | Team Calendars | Company Calendars | External Calendars |
|------|-------------|----------------|-------------------|-------------------|
| Executive | ✅ | ✅ | ✅ | ⚠️ (if shared) |
| Manager | ✅ | ✅ | ⚠️ (if shared) | ❌ |
| Senior IC | ✅ | ⚠️ (if shared) | ❌ | ❌ |
| IC | ✅ | ⚠️ (if shared) | ❌ | ❌ |
| External | ❌ | ❌ | ❌ | ❌ |

## 🎥 Google Meet API v2 Permissions

### **meet_v2_create_space**
| Role | Basic Space | Restricted Access | Recording Enabled | Transcription | Smart Notes |
|------|-------------|-------------------|-------------------|---------------|-------------|
| Executive | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ | ✅ | ✅ | ⚠️ (license required) |
| Senior IC | ✅ | ⚠️ (approval required) | ✅ | ✅ | ⚠️ (license required) |
| IC | ✅ | ❌ | ⚠️ (approval required) | ✅ | ❌ |
| External | ❌ | ❌ | ❌ | ❌ | ❌ |

### **meet_v2_update_space**
| Role | Own Spaces | Team Spaces | Company Spaces |
|------|------------|-------------|----------------|
| Executive | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ (if host) | ❌ |
| Senior IC | ✅ | ⚠️ (if co-host) | ❌ |
| IC | ✅ | ❌ | ❌ |
| External | ❌ | ❌ | ❌ |

### **meet_v2_end_active_conference**
| Role | Own Meetings | Team Meetings | Company Meetings |
|------|-------------|---------------|------------------|
| Executive | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ (if host) | ❌ |
| Senior IC | ✅ | ⚠️ (if co-host) | ❌ |
| IC | ✅ | ❌ | ❌ |
| External | ❌ | ❌ | ❌ |

### **Conference Records & Analytics**

#### **meet_v2_list_conference_records**
| Role | Own Meetings | Team Meetings | Company Meetings | Historical Data |
|------|-------------|---------------|------------------|-----------------|
| Executive | ✅ | ✅ | ✅ | ✅ (all accessible) |
| Manager | ✅ | ✅ | ⚠️ (if participant) | ⚠️ (team only) |
| Senior IC | ✅ | ⚠️ (if participant) | ⚠️ (if participant) | ❌ |
| IC | ✅ | ⚠️ (if participant) | ❌ | ❌ |
| External | ❌ | ❌ | ❌ | ❌ |

#### **Recordings & Transcripts Access**
| Role | Own Recordings | Team Recordings | Company Recordings | Download Rights |
|------|---------------|----------------|-------------------|-----------------|
| Executive | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ (if host) | ⚠️ (if participant) | ✅ |
| Senior IC | ✅ | ⚠️ (if participant) | ⚠️ (if participant) | ⚠️ (with approval) |
| IC | ✅ | ⚠️ (if participant) | ❌ | ❌ |
| External | ❌ | ❌ | ❌ | ❌ |

#### **Participant Data Access**
| Role | Own Meetings | Team Meetings | Company Meetings | PII Access |
|------|-------------|---------------|------------------|------------|
| Executive | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ | ⚠️ (aggregated only) | ⚠️ (team only) |
| Senior IC | ✅ | ⚠️ (if host) | ❌ | ❌ |
| IC | ✅ | ❌ | ❌ | ❌ |
| External | ❌ | ❌ | ❌ | ❌ |

## 🔒 Security & Compliance Rules

### **Meeting Classification Permissions**

#### **Public Meetings**
- **Who can create**: All roles
- **Access control**: OPEN or TRUSTED
- **Recording**: Optional
- **External participants**: Allowed
- **Data retention**: Standard (1 year)

#### **Internal Meetings**
- **Who can create**: IC and above
- **Access control**: TRUSTED required
- **Recording**: Recommended
- **External participants**: With approval
- **Data retention**: Standard (1 year)

#### **Confidential Meetings**
- **Who can create**: Manager and above
- **Access control**: RESTRICTED only
- **Recording**: Mandatory (with consent)
- **External participants**: Prohibited
- **Data retention**: Extended (7 years)

#### **Executive Meetings**
- **Who can create**: Executive only
- **Access control**: RESTRICTED only
- **Recording**: At discretion
- **External participants**: Prohibited
- **Data retention**: Per legal requirements

### **Data Access & Retention Rules**

#### **Personal Data**
```yaml
Own Meeting Data:
  - Full access to all personal meeting records
  - Can download recordings and transcripts
  - Can delete personal meeting data
  - Full control over personal calendar

Participant Data:
  - Can see who attended their meetings
  - Cannot access other's personal meeting patterns
  - Cannot see detailed engagement metrics of others
  - Must respect privacy in analytics
```

#### **Team Data**
```yaml
Team Meeting Data (Managers):
  - Full access to team meeting records
  - Can analyze team meeting patterns
  - Can access team productivity metrics
  - Cannot share individual performance data

Team Meeting Data (ICs):
  - Can access meetings they participated in
  - Cannot access team-level analytics
  - Cannot see other team members' individual patterns
  - Can see aggregated team statistics
```

#### **Company Data**
```yaml
Company Meeting Data (Executives):
  - Full access to company meeting analytics
  - Can analyze cross-team patterns
  - Can access compliance and audit data
  - Can generate executive reports

Company Meeting Data (Others):
  - Cannot access company-wide analytics
  - Cannot see other department's data
  - Cannot access executive meeting data
  - Limited to own team/participation data
```

## ⚠️ Conditional Access Rules

### **Approval Required Scenarios**

#### **External Participant Approval**
```yaml
Always Requires Approval:
  - Competitor employees
  - Government officials
  - Media representatives
  - Unverified external contacts

Manager Approval Required:
  - Client meetings with recording
  - Vendor meetings with confidential data
  - Partner meetings with IP discussions

Executive Approval Required:
  - Board-level external participants
  - Regulatory body meetings
  - Legal proceeding participants
```

#### **Recording Permission Approval**
```yaml
Auto-Approved:
  - Manager recording team meetings
  - Executive recording any meetings
  - Training session recordings

Approval Required:
  - IC recording meetings with external participants
  - Recording meetings with sensitive data
  - Recording one-on-one conversations

Prohibited:
  - Recording HR discipline meetings
  - Recording legal privilege conversations
  - Recording without participant consent
```

### **Time-Based Restrictions**

#### **After-Hours Meetings**
```yaml
Standard Hours: 9 AM - 5 PM Local Time
Extended Hours: 7 AM - 8 PM Local Time

After-Hours Rules:
  - Manager approval required for team meetings
  - Executive meetings exempt from restrictions
  - External meetings require justification
  - Recording automatic for audit purposes
```

#### **Holiday/Weekend Restrictions**
```yaml
Weekend Meetings:
  - Emergency-only for IC level
  - Manager approval required
  - Executive meetings always allowed
  - Automatic premium feature enablement

Holiday Meetings:
  - Executive approval required for all roles
  - Emergency escalation procedures apply
  - Additional compensation considerations
  - Enhanced audit logging
```

## 🚨 Escalation Triggers

### **Automatic Escalation to Admin**
- User requests exceed role permissions
- Security policy violations detected
- Unusual meeting pattern alerts
- Compliance requirement violations

### **Escalation to Google UI**
- Advanced calendar delegation setup
- Complex room/resource booking
- Workspace-level policy configuration
- Hardware device management

### **Escalation to Legal/HR**
- Requests for sensitive meeting data
- Compliance investigation requirements
- Employee privacy concerns
- Data retention policy questions

---

**🎯 This permissions matrix should be reviewed quarterly and updated based on business needs, security requirements, and regulatory changes. All access decisions should be logged for audit purposes.**