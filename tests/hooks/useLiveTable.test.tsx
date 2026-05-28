import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useLiveTable } from '../../src/hooks/useLiveTable';

// 模拟dexie-react-hooks中的useLiveQuery
// 由于Hook测试通常需要React渲染器（jsdom），这里通过mock验证逻辑
const mockUseLiveQuery = vi.fn();
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (...args: unknown[]) => mockUseLiveQuery(...args),
}));

// 模拟Dexie Table对象
function createMockTable<T>(data: T[]) {
  return {
    toArray: vi.fn(() => Promise.resolve(data)),
  } as unknown as import('dexie').Table<T>;
}

describe('useLiveTable - 实时查询Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 测试：无queryFn时应使用table.toArray()
  it('无queryFn时应调用table.toArray()', () => {
    const table = createMockTable([{ id: '1', name: 'test' }]);
    mockUseLiveQuery.mockReturnValue([{ id: '1', name: 'test' }]);

    useLiveTable(table);

    expect(mockUseLiveQuery).toHaveBeenCalledTimes(1);
    // 第一个参数应为使用toArray的函数
    const queryFn = mockUseLiveQuery.mock.calls[0][0];
    expect(typeof queryFn).toBe('function');
  });

  // 测试：提供自定义queryFn时应使用它
  it('提供自定义queryFn时应使用该函数', () => {
    const table = createMockTable([]);
    const customQuery = vi.fn(() => Promise.resolve([{ id: '2' }]));
    mockUseLiveQuery.mockReturnValue([{ id: '2' }]);

    useLiveTable(table, customQuery);

    const passedFn = mockUseLiveQuery.mock.calls[0][0];
    expect(passedFn).toBe(customQuery);
  });

  // 测试：queryFn结果为undefined时应返回空数组
  it('useLiveQuery返回undefined时应返回空数组', () => {
    const table = createMockTable([]);
    mockUseLiveQuery.mockReturnValue(undefined);

    const result = useLiveTable(table);

    expect(result).toEqual([]);
  });

  // 测试：应正确传递deps参数
  it('应将deps传递给useLiveQuery', () => {
    const table = createMockTable([]);
    const deps = ['dep1', 'dep2'];
    mockUseLiveQuery.mockReturnValue([]);

    useLiveTable(table, undefined, deps);

    // 第二个参数应为deps数组
    expect(mockUseLiveQuery.mock.calls[0][1]).toEqual(deps);
  });

  // 测试：应传递空数组作为默认deps
  it('无deps时应传递空数组', () => {
    const table = createMockTable([]);
    mockUseLiveQuery.mockReturnValue([]);

    useLiveTable(table);

    expect(mockUseLiveQuery.mock.calls[0][1]).toEqual([]);
  });
});
