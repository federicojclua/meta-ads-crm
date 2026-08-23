import { describe, it, expect } from 'vitest';
import { parseCsvString } from '../lib/csvParser';

describe('CSV Parser Unit Tests (parseCsvString)', () => {
  it('1. Parsea correctamente campos simples separados por coma', () => {
    const csv = 'Nombre,Email,Telefono\nCarlos Gómez,carlos@demo.com,+5491112345678';
    const result = parseCsvString(csv);

    expect(result.error).toBeUndefined();
    expect(result.rows.length).toBe(1);
    expect(result.rows[0].name).toBe('Carlos Gómez');
    expect(result.rows[0].email).toBe('carlos@demo.com');
    expect(result.rows[0].phone).toBe('+5491112345678');
    expect(result.rows[0].isValid).toBe(true);
  });

  it('2. Parsea campos con comas dentro de comillas ("Gomez, Juan")', () => {
    const csv = 'Nombre,Email,Telefono\n"Gómez, Juan",juan@demo.com,+5491100000000';
    const result = parseCsvString(csv);

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].name).toBe('Gómez, Juan');
    expect(result.rows[0].email).toBe('juan@demo.com');
  });

  it('3. Parsea saltos de línea dentro de campos entre comillas', () => {
    const csv = 'Nombre,Email,Notas\nAna Lopez,ana@demo.com,"Nota linea 1\nNota linea 2"';
    const result = parseCsvString(csv);

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].name).toBe('Ana Lopez');
    expect(result.rows[0].notes).toBe('Nota linea 1\nNota linea 2');
  });

  it('4. Soporta archivos con saltos de línea estilo Windows (CRLF \\r\\n)', () => {
    const csv = "Nombre,Email,Telefono\r\nMaria Perez,maria@demo.com,+5491122223333\r\nPedro Diaz,pedro@demo.com,+5491144445555\r\n";
    const result = parseCsvString(csv);

    expect(result.rows.length).toBe(2);
    expect(result.rows[0].name).toBe('Maria Perez');
    expect(result.rows[1].name).toBe('Pedro Diaz');
  });

  it('5. Elimina y tolera UTF-8 BOM exportado por Excel (\\uFEFF)', () => {
    const csvWithBom = '\uFEFFNombre,Email,Telefono\nLucas Silva,lucas@demo.com,+5491199998888';
    const result = parseCsvString(csvWithBom);

    expect(result.headers[0]).toBe('Nombre');
    expect(result.rows.length).toBe(1);
    expect(result.rows[0].name).toBe('Lucas Silva');
  });

  it('6. Detecta automáticamente separador punto y coma (;)', () => {
    const csv = 'Nombre;Email;Telefono;Vendedor\nMariana Paz;mariana@demo.com;+5491155556666;vendedor@empresa.com';
    const result = parseCsvString(csv);

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].name).toBe('Mariana Paz');
    expect(result.rows[0].email).toBe('mariana@demo.com');
    expect(result.rows[0].assignedSalespersonEmail).toBe('vendedor@empresa.com');
  });

  it('7. Parsea comillas escapadas estilo CSV (""Hola"")', () => {
    const csv = 'Nombre,Email,Notas\nRoberto Rossi,roberto@demo.com,"Dijo ""Hola mundo"" hoy"';
    const result = parseCsvString(csv);

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].notes).toBe('Dijo "Hola mundo" hoy');
  });

  it('8. Ignora filas completamente vacías', () => {
    const csv = 'Nombre,Email,Telefono\n\nJuan Perez,juan@demo.com,+5491111111111\n\n\n';
    const result = parseCsvString(csv);

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].name).toBe('Juan Perez');
  });

  it('9. Tolera columnas adicionales y campos opcionales', () => {
    const csv = 'Nombre,Email,Telefono,ColumnaExtra1,ColumnaExtra2,Notas\nLaura,laura@demo.com,+5491177778888,ExtraVal1,ExtraVal2,Nota test';
    const result = parseCsvString(csv);

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].name).toBe('Laura');
    expect(result.rows[0].notes).toBe('Nota test');
  });

  it('10. Rechaza archivos que superen 1 MB (maxBytes)', () => {
    const hugeCsv = 'Nombre,Email,Telefono\n' + 'A'.repeat(1024 * 1024 + 10);
    const result = parseCsvString(hugeCsv, { maxBytes: 1024 * 1024 });

    expect(result.error).toContain('supera el tamaño máximo permitido');
    expect(result.rows.length).toBe(0);
  });

  it('11. Rechaza archivos con más de 500 filas (maxRows)', () => {
    let rowsCsv = 'Nombre,Email,Telefono\n';
    for (let i = 1; i <= 501; i++) {
      rowsCsv += `Contacto ${i},contacto${i}@demo.com,+5491100000000\n`;
    }
    const result = parseCsvString(rowsCsv, { maxRows: 500 });

    expect(result.error).toContain('superando el límite de 500 filas');
    expect(result.rows.length).toBe(0);
  });
});
