import { describe, it, expect } from 'vitest';
import {
  parseBibTeX,
  generateBibTeX,
  entryToRecord,
  recordToBibTeX,
  type BibTeXEntry,
} from '../../../src/core/citation/bibtex';

describe('parseBibTeX - BibTeX解析', () => {
  // 测试：解析单条标准BibTeX条目
  it('应正确解析单条article条目', () => {
    const input = `@article{smith2024,
  title = {Quantum Materials},
  author = {Smith, John},
  year = {2024},
  journal = {Nature Physics}
}`;
    const entries = parseBibTeX(input);
    expect(entries).toHaveLength(1);
    expect(entries[0].key).toBe('smith2024');
    expect(entries[0].type).toBe('article');
    expect(entries[0].fields.title).toBe('Quantum Materials');
    expect(entries[0].fields.authors).toBe('Smith, John');
    expect(entries[0].fields.year).toBe('2024');
    expect(entries[0].fields.journal).toBe('Nature Physics');
  });

  // 测试：解析多条BibTeX条目
  it('应正确解析多条条目', () => {
    const input = `@article{ref1,
  title = {First Paper},
  year = {2023}
}

@inproceedings{ref2,
  title = {Second Paper},
  booktitle = {ICML 2024}
}`;
    const entries = parseBibTeX(input);
    expect(entries).toHaveLength(2);
    expect(entries[0].key).toBe('ref1');
    expect(entries[1].key).toBe('ref2');
    expect(entries[1].type).toBe('inproceedings');
    expect(entries[1].fields.booktitle).toBe('ICML 2024');
  });

  // 测试：解析包含DOI和URL的条目
  it('应解析DOI和URL字段', () => {
    const input = `@article{test,
  title = {Test Paper},
  doi = {10.1234/example},
  url = {https://example.com}
}`;
    const entries = parseBibTeX(input);
    expect(entries[0].fields.doi).toBe('10.1234/example');
    expect(entries[0].fields.url).toBe('https://example.com');
  });

  // 测试：空输入应返回空数组
  it('空输入应返回空数组', () => {
    expect(parseBibTeX('')).toEqual([]);
  });

  // 测试：包含嵌套大括号的字段值
  it('应正确处理嵌套大括号的字段值', () => {
    const input = `@article{test,
  title = {A {Complex} Title with {Nested} Braces}
}`;
    const entries = parseBibTeX(input);
    expect(entries[0].fields.title).toBe('A {Complex} Title with {Nested} Braces');
  });
});

describe('generateBibTeX - BibTeX生成', () => {
  // 测试：从条目对象生成有效的BibTeX字符串
  it('应从条目生成有效的BibTeX字符串', () => {
    const entries: BibTeXEntry[] = [{
      key: 'smith2024',
      type: 'article',
      fields: {
        title: 'Quantum Materials',
        authors: 'Smith, John',
        year: '2024',
      },
    }];
    const output = generateBibTeX(entries);
    expect(output).toContain('@article{smith2024,');
    expect(output).toContain('title = {Quantum Materials}');
    expect(output).toContain('authors = {Smith, John}');
  });

  // 测试：空值字段不应出现在输出中
  it('应过滤空值字段', () => {
    const entries: BibTeXEntry[] = [{
      key: 'test',
      type: 'misc',
      fields: {
        title: 'Only Title',
        doi: '',
      },
    }];
    const output = generateBibTeX(entries);
    expect(output).toContain('title = {Only Title}');
    expect(output).not.toContain('doi');
  });

  // 测试：多条目之间用空行分隔
  it('多条目之间应用空行分隔', () => {
    const entries: BibTeXEntry[] = [
      { key: 'a', type: 'article', fields: { title: 'A' } },
      { key: 'b', type: 'article', fields: { title: 'B' } },
    ];
    const output = generateBibTeX(entries);
    expect(output).toContain('\n\n');
  });
});

describe('entryToRecord - BibTeX条目转记录', () => {
  // 测试：将BibTeX条目转换为标准记录格式
  it('应正确转换为记录格式', () => {
    const entry: BibTeXEntry = {
      key: 'smith2024',
      type: 'article',
      fields: {
        title: 'Test Title',
        authors: 'Smith, J.',
        year: '2024',
        journal: 'Nature',
        doi: '10.1234/test',
        keywords: 'physics, quantum, materials',
      },
    };
    const record = entryToRecord(entry);
    expect(record.title).toBe('Test Title');
    expect(record.authors).toBe('Smith, J.');
    expect(record.year).toBe('2024');
    expect(record.journal).toBe('Nature');
    expect(record.doi).toBe('10.1234/test');
    expect(record.keywords).toEqual(['physics', 'quantum', 'materials']);
    expect(record.bibtexKey).toBe('smith2024');
    expect(record.entryType).toBe('article');
  });

  // 测试：缺失字段应使用空字符串默认值
  it('缺失字段应使用空字符串', () => {
    const entry: BibTeXEntry = { key: 'x', type: 'misc', fields: {} };
    const record = entryToRecord(entry);
    expect(record.title).toBe('');
    expect(record.authors).toBe('');
    expect(record.year).toBe('');
    expect(record.keywords).toEqual([]);
  });
});

describe('recordToBibTeX - 记录转BibTeX条目', () => {
  // 测试：从简单记录创建BibTeX条目
  it('应从记录创建BibTeX条目', () => {
    const entry = recordToBibTeX('key1', 'article', {
      title: 'New Paper',
      authors: 'Doe, Jane',
      year: '2025',
    });
    expect(entry.key).toBe('key1');
    expect(entry.type).toBe('article');
    expect(entry.fields.title).toBe('New Paper');
    expect(entry.fields.author).toBe('Doe, Jane');
  });

  // 测试：未提供的字段不应出现在fields中
  it('未提供的字段不应出现', () => {
    const entry = recordToBibTeX('key1', 'misc', { title: 'Only Title' });
    expect(entry.fields).toEqual({ title: 'Only Title' });
    expect(entry.fields.author).toBeUndefined();
  });
});
