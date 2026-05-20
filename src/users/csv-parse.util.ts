/** Minimal RFC 4180-style CSV parser (comma-separated, quoted fields). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field.trim());
      field = '';
    } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
      row.push(field.trim());
      field = '';
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      if (ch === '\r') i++;
    } else if (ch !== '\r') {
      field += ch;
    }
  }

  row.push(field.trim());
  if (row.some((c) => c.length > 0)) rows.push(row);

  return rows;
}

const HEADER_ALIASES: Record<string, string> = {
  email: 'email',
  correo: 'email',
  name: 'name',
  nombre: 'name',
  lastname: 'lastname',
  apellido: 'lastname',
  apellidos: 'lastname',
  idcard: 'idCard',
  carnet: 'idCard',
  sectionnumber: 'sectionNumber',
  seccion: 'sectionNumber',
  section: 'sectionNumber',
  groupnumber: 'groupNumber',
  grupo: 'groupNumber',
  group: 'groupNumber',
  password: 'password',
  contrasena: 'password',
  contraseña: 'password',
};

export function mapCsvHeaders(headerRow: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  headerRow.forEach((raw, idx) => {
    const key = HEADER_ALIASES[raw.trim().toLowerCase().replace(/\s+/g, '')];
    if (key) map[key] = idx;
  });
  return map;
}
