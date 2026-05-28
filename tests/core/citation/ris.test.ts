import { describe, it, expect } from 'vitest';
import {
  parseRIS,
  entryToRecord,
  generateRIS,
  type RISEntry,
} from '../../../src/core/citation/ris';

describe('parseRIS - RIS解析', () => {
  // 测试：解析标准RIS条目
  it('应正确解析标准RIS条目', () => {
    const input = `TY  - JOUR
TI  - Quantum Materials Study
AU  - Smith, John
PY  - 2024
JO  - Nature Physics
DO  - 10.1234/example
ER  -`;
    const entries = parseRIS(input);
    expect(entries).toHaveLength(1);
    expect(entries[0].fields._type).toEqual(['JOUR']);
    expect(entries[0].fields.title).toEqual(['Quantum Materials Study']);
    expect(entries[0].fields.authors).toEqual(['Smith, John']);
    expect(entries[0].fields.year).toEqual(['2024']);
  });

  // 测试：解析多条RIS条目
  it('应正确解析多条RIS条目', () => {
    const input = `TY  - JOUR
TI  - First Paper
ER  -

TY  - BOOK
TI  - A Book Title
ER  -`;
    const entries = parseRIS(input);
    expect(entries).toHaveLength(2);
    expect(entries[0].fields._type).toEqual(['JOUR']);
    expect(entries[1].fields._type).toEqual(['BOOK']);
  });

  // 测试：解析包含多个作者的条目
  it('应收集多个AU标签到同一数组', () => {
    const input = `TY  - JOUR
AU  - Smith, John
AU  - Doe, Jane
AU  - Brown, Bob
ER  -`;
    const entries = parseRIS(input);
    expect(entries[0].fields.authors).toEqual([
      'Smith, John',
      'Doe, Jane',
      'Brown, Bob',
    ]);
  });

  // 测试：解析包含关键词的条目
  it('应解析KW标签为keywords数组', () => {
    const input = `TY  - JOUR
KW  - physics
KW  - quantum
KW  - materials
ER  -`;
    const entries = parseRIS(input);
    expect(entries[0].fields.keywords).toEqual([
      'physics',
      'quantum',
      'materials',
    ]);
  });

  // 测试：空输入应返回空数组
  it('空输入应返回空数组', () => {
    expect(parseRIS('')).toEqual([]);
  });

  // 测试：忽略不符合格式的行
  it('应忽略不符合RIS格式的行', () => {
    const input = `This is not RIS format
Some random text
TY  - JOUR
TI  - Valid Title
ER  -`;
    const entries = parseRIS(input);
    expect(entries).toHaveLength(1);
    expect(entries[0].fields.title).toEqual(['Valid Title']);
  });
});

describe('entryToRecord - RIS条目转记录', () => {
  // 测试：将RIS条目转换为标准记录格式
  it('应正确转换为记录格式', () => {
    const entry: RISEntry = {
      fields: {
        _type: ['JOUR'],
        title: ['Test Title'],
        authors: ['Smith, J.', 'Doe, J.'],
        year: ['2024'],
        journal: ['Nature'],
        doi: ['10.1234/test'],
        abstract: ['This is the abstract.'],
        keywords: ['physics', 'quantum'],
        volume: ['10'],
        number: ['3'],
        pagesStart: ['100'],
        pagesEnd: ['200'],
      },
    };
    const record = entryToRecord(entry);
    expect(record.title).toBe('Test Title');
    expect(record.authors).toBe('Smith, J.; Doe, J.');
    expect(record.year).toBe('2024');
    expect(record.journal).toBe('Nature');
    expect(record.doi).toBe('10.1234/test');
    expect(record.abstract).toBe('This is the abstract.');
    expect(record.keywords).toEqual(['physics', 'quantum']);
    expect(record.volume).toBe('10');
    expect(record.number).toBe('3');
    expect(record.pages).toBe('100-200');
    expect(record.entryType).toBe('JOUR');
  });

  // 测试：缺失字段应使用空默认值
  it('缺失字段应使用空默认值', () => {
    const entry: RISEntry = { fields: {} };
    const record = entryToRecord(entry);
    expect(record.title).toBe('');
    expect(record.authors).toBe('');
    expect(record.year).toBe('');
    expect(record.journal).toBe('');
    expect(record.keywords).toEqual([]);
    expect(record.entryType).toBe('JOUR'); // 默认类型
  });

  // 测试：仅有起始页码时pages不应包含连字符
  it('仅有起始页码时不应包含尾部连字符', () => {
    const entry: RISEntry = {
      fields: {
        pagesStart: ['10'],
      },
    };
    const record = entryToRecord(entry);
    expect(record.pages).toBe('10');
  });
});

describe('generateRIS - RIS生成', () => {
  // 测试：从条目生成有效的RIS字符串
  it('应从条目生成有效的RIS字符串', () => {
    const entries: RISEntry[] = [{
      fields: {
        _type: ['JOUR'],
        title: ['Generated Title'],
        authors: ['Smith, J.'],
        year: ['2024'],
      },
    }];
    const output = generateRIS(entries);
    expect(output).toContain('TY  - JOUR');
    expect(output).toContain('TI  - Generated Title');
    expect(output).toContain('AU  - Smith, J.');
    expect(output).toContain('PY  - 2024');
    expect(output).toContain('ER  -');
  });

  // 测试：多条目之间应有空行分隔
  it('多条目之间应有空行分隔', () => {
    const entries: RISEntry[] = [
      { fields: { _type: ['JOUR'], title: ['A'] } },
      { fields: { _type: ['BOOK'], title: ['B'] } },
    ];
    const output = generateRIS(entries);
    expect(output).toContain('\n\n');
  });

  // 测试：默认类型应为JOUR
  it('未指定类型时应默认为JOUR', () => {
    const entries: RISEntry[] = [{
      fields: { title: ['No Type'] },
    }];
    const output = generateRIS(entries);
    expect(output).toContain('TY  - JOUR');
  });
});
