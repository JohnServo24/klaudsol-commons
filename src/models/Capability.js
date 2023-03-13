import DB from "../lib/DB";
import InsufficientPermissionsError from "../errors/InsufficientPermissionsError";

export default class Capability {
  static async getCapabilitiesByLoggedInUser(session_token) {
    const db = new DB();

    const sql = `SELECT DISTINCT capabilities.name from people_groups 
    LEFT JOIN groups ON groups.id = people_groups.group_id
    LEFT JOIN group_capabilities ON group_capabilities.group_id = groups.id
    LEFT JOIN capabilities ON capabilities.id = group_capabilities.capabilities_id
    WHERE people_groups.people_id IN (select people_id from sessions where session = :session_token) AND capabilities.name IS NOT NULL`;

    const rawCapabilites = await db.executeStatement(sql, [
      { name: "session_token", value: { stringValue: session_token } },
    ]);

    const userCapabilities = rawCapabilites.records.map(
      ([{ stringValue: capability }]) => capability
    );

    return userCapabilities;
  }

  static async getCapabilitiesByGuest() {
    const db = new DB();

    const sql = `SELECT DISTINCT capabilities.name FROM groups 
    LEFT JOIN group_capabilities ON group_capabilities.group_id = groups.id
    LEFT JOIN capabilities ON capabilities.id = group_capabilities.capabilities_id WHERE groups.name = "Guests"`;

    const rawCapabilites = await db.executeStatement(sql, []);

    const userCapabilities = rawCapabilites.records.map(
      ([{ stringValue: capability }]) => capability
    );

    return userCapabilities;
  }
}
