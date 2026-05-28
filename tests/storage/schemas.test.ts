import { describe, it, expect } from 'vitest';
import {
  ProjectSchema,
  ResearchRecordSchema,
  ManuscriptSchema,
  SubmissionSchema,
  TaskSchema,
  ResearchAreaSchema,
  EvidenceSchema,
  SchemaTemplateSchema,
  HypothesisSchema,
  ExperimentSchema,
} from '../../src/storage/schemas';

// 用于生成合法ISO datetime字符串的辅助函数
function isoDate(): string {
  return new Date().toISOString();
}

describe('ProjectSchema - 项目实体验证', () => {
  // 测试：完整的合法项目数据应通过验证
  it('应接受完整的合法项目数据', () => {
    const valid = {
      id: 'proj_123',
      userId: 'user_1',
      title: '量子材料研究',
      discipline: 'physics',
      hypothesis: '假设内容',
      abstract: '摘要内容',
      status: 'active' as const,
      areaId: null,
      createdAt: isoDate(),
      updatedAt: isoDate(),
    };
    expect(ProjectSchema.parse(valid)).toEqual(valid);
  });

  // 测试：缺少必填字段应抛出ZodError
  it('应拒绝缺少必填字段的项目', () => {
    const incomplete = { id: 'proj_123' };
    expect(() => ProjectSchema.parse(incomplete)).toThrow();
  });

  // 测试：status枚举值校验
  it('应拒绝无效的status值', () => {
    const base = {
      id: 'proj_123',
      userId: 'user_1',
      title: '测试',
      discipline: 'physics',
      hypothesis: '',
      abstract: '',
      status: 'deleted', // 无效状态
      createdAt: isoDate(),
      updatedAt: isoDate(),
    };
    expect(() => ProjectSchema.parse(base)).toThrow();
  });

  // 测试：title为空字符串应失败（min(1)约束）
  it('应拒绝空标题', () => {
    const base = {
      id: 'proj_123',
      userId: 'user_1',
      title: '',
      discipline: 'physics',
      hypothesis: '',
      abstract: '',
      status: 'active' as const,
      createdAt: isoDate(),
      updatedAt: isoDate(),
    };
    expect(() => ProjectSchema.parse(base)).toThrow();
  });

  // 测试：areaId为可选字段，undefined应被接受
  it('应接受不带areaId的项目', () => {
    const data = {
      id: 'proj_123',
      userId: 'user_1',
      title: '测试项目',
      discipline: 'physics',
      hypothesis: '',
      abstract: '',
      status: 'planning' as const,
      createdAt: isoDate(),
      updatedAt: isoDate(),
    };
    const result = ProjectSchema.parse(data);
    expect(result.areaId).toBeUndefined();
  });
});

describe('ResearchRecordSchema - 研究记录验证', () => {
  // 测试：完整合法的研究记录
  it('应接受完整的合法研究记录', () => {
    const valid = {
      id: 'rec_1',
      userId: 'user_1',
      projectId: 'proj_1',
      schemaTemplateId: null,
      title: '文献阅读笔记',
      recordType: 'literature',
      methodology: 'qualitative',
      recordedDate: '2026-01-15',
      attributes: { key: 'value' },
      dataPath: '/data/rec_1',
      externalRef: null,
      summary: '摘要',
      tags: ['physics', 'quantum'],
      readingStatus: 'reading' as const,
      starred: true,
      createdAt: isoDate(),
      updatedAt: isoDate(),
    };
    expect(ResearchRecordSchema.parse(valid)).toEqual(valid);
  });

  // 测试：tags应为字符串数组
  it('应拒绝tags为非数组类型', () => {
    const base = {
      id: 'rec_1',
      userId: 'user_1',
      projectId: 'proj_1',
      schemaTemplateId: null,
      title: '测试',
      recordType: 'note',
      methodology: '',
      recordedDate: '2026-01-01',
      attributes: {},
      dataPath: '',
      externalRef: null,
      summary: '',
      tags: 'not-an-array', // 应为数组
      createdAt: isoDate(),
      updatedAt: isoDate(),
    };
    expect(() => ResearchRecordSchema.parse(base)).toThrow();
  });

  // 测试：readingStatus默认值为'unread'
  it('未提供readingStatus时应默认为unread', () => {
    const data = {
      id: 'rec_1',
      userId: 'user_1',
      projectId: 'proj_1',
      schemaTemplateId: null,
      title: '测试',
      recordType: 'note',
      methodology: '',
      recordedDate: '2026-01-01',
      attributes: {},
      dataPath: '',
      externalRef: null,
      summary: '',
      tags: [],
      createdAt: isoDate(),
      updatedAt: isoDate(),
    };
    const result = ResearchRecordSchema.parse(data);
    expect(result.readingStatus).toBe('unread');
  });

  // 测试：starred默认值为false
  it('未提供starred时应默认为false', () => {
    const data = {
      id: 'rec_1',
      userId: 'user_1',
      projectId: 'proj_1',
      schemaTemplateId: null,
      title: '测试',
      recordType: 'note',
      methodology: '',
      recordedDate: '2026-01-01',
      attributes: {},
      dataPath: '',
      externalRef: null,
      summary: '',
      tags: [],
      createdAt: isoDate(),
      updatedAt: isoDate(),
    };
    const result = ResearchRecordSchema.parse(data);
    expect(result.starred).toBe(false);
  });

  // 测试：readingStatus仅接受特定枚举值
  it('应拒绝无效的readingStatus值', () => {
    const data = {
      id: 'rec_1',
      userId: 'user_1',
      projectId: 'proj_1',
      schemaTemplateId: null,
      title: '测试',
      recordType: 'note',
      methodology: '',
      recordedDate: '2026-01-01',
      attributes: {},
      dataPath: '',
      externalRef: null,
      summary: '',
      tags: [],
      readingStatus: 'finished', // 无效值
      createdAt: isoDate(),
      updatedAt: isoDate(),
    };
    expect(() => ResearchRecordSchema.parse(data)).toThrow();
  });
});

describe('ManuscriptSchema - 手稿验证', () => {
  // 测试：完整的合法手稿数据
  it('应接受完整的合法手稿', () => {
    const valid = {
      id: 'ms_1',
      projectId: 'proj_1',
      title: '量子纠缠论文',
      abstract: '本文研究...',
      status: 'draft' as const,
      authors: ['张三', '李四'],
      journal: 'Nature',
      sections: [{ id: 's1', title: '引言', content: '...', order: 0 }],
      createdAt: isoDate(),
      updatedAt: isoDate(),
    };
    expect(ManuscriptSchema.parse(valid)).toEqual(valid);
  });

  // 测试：sections默认为空数组
  it('未提供sections时应默认为空数组', () => {
    const data = {
      id: 'ms_1',
      projectId: 'proj_1',
      title: '测试手稿',
      abstract: '',
      status: 'preparing' as const,
      authors: [],
      journal: '',
      createdAt: isoDate(),
      updatedAt: isoDate(),
    };
    const result = ManuscriptSchema.parse(data);
    expect(result.sections).toEqual([]);
  });

  // 测试：无效的status枚举值
  it('应拒绝无效的手稿状态', () => {
    const data = {
      id: 'ms_1',
      projectId: 'proj_1',
      title: '测试',
      abstract: '',
      status: 'deleted',
      authors: [],
      journal: '',
      createdAt: isoDate(),
      updatedAt: isoDate(),
    };
    expect(() => ManuscriptSchema.parse(data)).toThrow();
  });
});

describe('TaskSchema - 任务验证', () => {
  // 测试：完整的合法任务数据
  it('应接受完整的合法任务', () => {
    const valid = {
      id: 'task_1',
      userId: 'user_1',
      projectId: 'proj_1',
      title: '完成文献综述',
      description: '阅读并总结20篇相关论文',
      status: 'todo' as const,
      priority: 2,
      dueDate: '2026-06-01',
      completedAt: null,
      createdAt: isoDate(),
      updatedAt: isoDate(),
    };
    expect(TaskSchema.parse(valid)).toEqual(valid);
  });

  // 测试：priority范围校验（0-3）
  it('应拒绝priority超出范围的值', () => {
    const base = {
      id: 'task_1',
      userId: 'user_1',
      projectId: 'proj_1',
      title: '测试',
      description: '',
      status: 'todo' as const,
      priority: 5, // 超出最大值3
      dueDate: null,
      completedAt: null,
      createdAt: isoDate(),
      updatedAt: isoDate(),
    };
    expect(() => TaskSchema.parse(base)).toThrow();
  });

  // 测试：priority为负数应失败
  it('应拒绝负数priority', () => {
    const data = {
      id: 'task_1',
      userId: 'user_1',
      projectId: 'proj_1',
      title: '测试',
      description: '',
      status: 'todo' as const,
      priority: -1,
      dueDate: null,
      completedAt: null,
      createdAt: isoDate(),
      updatedAt: isoDate(),
    };
    expect(() => TaskSchema.parse(data)).toThrow();
  });
});

describe('EvidenceSchema - 证据验证', () => {
  // 测试：完整的合法证据数据
  it('应接受完整的合法证据', () => {
    const valid = {
      id: 'ev_1',
      userId: 'user_1',
      projectId: 'proj_1',
      title: '实验数据集A',
      description: 'X射线衍射数据',
      evidenceType: 'dataset',
      filePath: '/data/experiment_a.csv',
      fileSize: 1024,
      createdAt: isoDate(),
      updatedAt: isoDate(),
    };
    expect(EvidenceSchema.parse(valid)).toEqual(valid);
  });

  // 测试：fileSize必须为非负整数
  it('应拒绝负数的fileSize', () => {
    const data = {
      id: 'ev_1',
      userId: 'user_1',
      projectId: 'proj_1',
      title: '测试',
      description: '',
      evidenceType: 'file',
      filePath: '',
      fileSize: -1,
      createdAt: isoDate(),
      updatedAt: isoDate(),
    };
    expect(() => EvidenceSchema.parse(data)).toThrow();
  });
});

describe('HypothesisSchema - 假设验证', () => {
  // 测试：完整合法假设
  it('应接受完整的合法假设', () => {
    const valid = {
      id: 'hyp_1',
      projectId: 'proj_1',
      statement: '高温超导体在特定条件下...',
      status: 'testing' as const,
      evidenceIds: ['ev_1', 'ev_2'],
      notes: '初步验证通过',
      createdAt: isoDate(),
      updatedAt: isoDate(),
    };
    expect(HypothesisSchema.parse(valid)).toEqual(valid);
  });

  // 测试：statement不能为空
  it('应拒绝空statement', () => {
    const data = {
      id: 'hyp_1',
      projectId: 'proj_1',
      statement: '',
      status: 'proposed' as const,
      evidenceIds: [],
      notes: '',
      createdAt: isoDate(),
      updatedAt: isoDate(),
    };
    expect(() => HypothesisSchema.parse(data)).toThrow();
  });
});
