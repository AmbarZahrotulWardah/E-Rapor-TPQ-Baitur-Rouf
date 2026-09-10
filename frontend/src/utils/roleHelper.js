import { ROLES, LABEL_ROLE } from './constants';

/** Daftar role dalam urutan tampilan. */
export const ROLE_LIST_HELPER = [ROLES.ADMIN, ROLES.USTADZ, ROLES.WALI_SANTRI];

/** Label singkat untuk kolom tabel. */
export const labelRole = (role) => LABEL_ROLE[role] || role;

/** Warna badge sesuai role. */
export const kelasBadgeRole = (role) => {
  switch (role) {
    case ROLES.ADMIN:
      return 'badge badge-biru';
    case ROLES.USTADZ:
      return 'badge badge-hijau';
    case ROLES.WALI_SANTRI:
      return 'badge badge-kuning';
    default:
      return 'badge badge-abu';
  }
};
