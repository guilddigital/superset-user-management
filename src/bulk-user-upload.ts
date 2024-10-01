import { CHA_TABLES } from './config/config';
import { IHeaders, IRowLevelSecurityFromSuperset } from './utils/interface';
import {
  addPermissionsForUserRole,
  getUserPermissions,
} from './utils/permissions';
import {
  SupersetRole,
  createUserRole,
  generatePermissions,
  generateRole,
} from './utils/role';
import {
  getAvailableRowlevelSecurityFromSuperset,
  generateRowLevelSecurity,
  createRowlevelSecurity,
} from './utils/rowlevelsecurity';
import { CSVUser, createUserAccount, generateUser } from './utils/user';

export const bulkUserUploadUg = async (
  users: CSVUser[],
  rolesAvailableOnSuperset: SupersetRole[],
  headers: IHeaders,
) => {
  const userPermissions = await getUserPermissions(
    rolesAvailableOnSuperset,
    headers,
  );
  const { result: rowLevelFromSuperset } =
    await getAvailableRowlevelSecurityFromSuperset(headers);
  for (const user of users) {
    let userRole: SupersetRole;
    // pass zone as null if not applicable
    const generatedRole = generateRole(user.role, user.place, user?.zone);

    const existingRoleOnSuperset = rolesAvailableOnSuperset.find(
      (ssrole: { id: number; name: string }) =>
        ssrole.name === generatedRole.name,
    );

    if (existingRoleOnSuperset) {
      userRole = existingRoleOnSuperset;
    } else {
      userRole = await createUserRole(generatedRole, headers);
      rolesAvailableOnSuperset.push({
        id: userRole.id,
        name: userRole.name,
      });
    }

    const rolePermissions = generatePermissions(userPermissions);
    await addPermissionsForUserRole(userRole.id, rolePermissions, headers);

    const generatedUser = generateUser(user, [userRole.id]);
    await createUserAccount(generatedUser, headers);

    const rowLevelSecurity = generateRowLevelSecurity(
      [userRole.id],
      user!.group,
      user.place,
      CHA_TABLES,
      user.role,
      user?.zone,
    );
    const doesRowLevelExist = rowLevelFromSuperset.some(
      (level: IRowLevelSecurityFromSuperset) =>
        level.name === rowLevelSecurity.name,
    );
    if (!doesRowLevelExist) {
      console.log({ ...rowLevelSecurity, description: '' });
      console.log({
        ...headers,
        Cookie:
          'session=.eJyVjkFOxDAMRe-SNVJtJ02cXgWhykkcOqKajprMAiHuTga2SIjlt9-z_4dZ66ltM0s_7_pk1ksxi4kwo40soWbvEoRAyhKpUCyzV-9QcyIQKJq8kEXGxLkoCoQcRBEqekuQfKUIxcPQyGmS4FIZ2thikcgusPPO88yUIAZxBSJXm6IZRe5Nz582OGJuZ1378abXMVDJ2Sdnq3KYBZiyrzbU4rFiwJnAkXDGNLz9yLLrw7mOdJNXXbdL68f5bpZns_V-W6bpG9qO1hcG5unxuU37wKbh_M6cx65_Mf-98_L5BXy4eXg.ZuqH4g.8QRgTwPU3faOmmOVP7JOIvNayW0',
      });
      const response = await createRowlevelSecurity(
        { ...rowLevelSecurity, description: '' },
        {
          ...headers,
          Cookie:
            'session=.eJyVjkFOxDAMRe-SNVJtJ02cXgWhykkcOqKajprMAiHuTga2SIjlt9-z_4dZ66ltM0s_7_pk1ksxi4kwo40soWbvEoRAyhKpUCyzV-9QcyIQKJq8kEXGxLkoCoQcRBEqekuQfKUIxcPQyGmS4FIZ2thikcgusPPO88yUIAZxBSJXm6IZRe5Nz582OGJuZ1378abXMVDJ2Sdnq3KYBZiyrzbU4rFiwJnAkXDGNLz9yLLrw7mOdJNXXbdL68f5bpZns_V-W6bpG9qO1hcG5unxuU37wKbh_M6cx65_Mf-98_L5BXy4eXg.ZuqH4g.8QRgTwPU3faOmmOVP7JOIvNayW0',
        },
      );
      rowLevelFromSuperset.push(response);
    }
  }
};
