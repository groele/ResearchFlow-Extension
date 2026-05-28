import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateId } from '../../src/storage/id';

// 模拟crypto.randomUUID以获得确定性测试结果
const mockUUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

describe('generateId - ID生成', () => {
  beforeEach(() => {
    // 模拟全局crypto.randomUUID
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => mockUUID),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 测试：生成的ID应以指定前缀开头
  it('应生成带指定前缀的ID', () => {
    const id = generateId('proj');
    expect(id).toBe(`proj_${mockUUID}`);
  });

  // 测试：不同前缀生成不同格式的ID
  it('应支持不同前缀', () => {
    expect(generateId('rec')).toBe(`rec_${mockUUID}`);
    expect(generateId('task')).toBe(`task_${mockUUID}`);
    expect(generateId('ms')).toBe(`ms_${mockUUID}`);
  });

  // 测试：每次调用应调用crypto.randomUUID
  it('每次调用应调用crypto.randomUUID', () => {
    generateId('proj');
    generateId('proj');
    expect(crypto.randomUUID).toHaveBeenCalledTimes(2);
  });

  // 测试：前缀和UUID之间用下划线分隔
  it('前缀和UUID之间应使用下划线分隔', () => {
    const id = generateId('test');
    expect(id).toContain('_');
    expect(id.split('_').length).toBe(2);
    expect(id.split('_')[0]).toBe('test');
    expect(id.split('_')[1]).toBe(mockUUID);
  });

  // 测试：空前缀也应正常工作
  it('应接受空前缀', () => {
    const id = generateId('');
    expect(id).toBe(`_${mockUUID}`);
  });
});
