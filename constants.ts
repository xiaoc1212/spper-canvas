import { Project } from './types';

export const INITIAL_DATA: Project[] = [
  {
    id: 'proj_1',
    name: 'Godot 游戏项目',
    icon: 'Gamepad2',
    groups: [
      {
        id: 'group_1',
        name: 'Supabase 认证',
        items: [
          { id: 'item_1', label: '项目 URL', value: 'https://xyz.supabase.co', type: 'text', x: 3050, y: 3050 },
          { id: 'item_2', label: 'Anon Key (公钥)', value: 'eyJhbGciOiJIUzI1NiIsInR5c...', type: 'password', x: 3050, y: 3200 },
          { id: 'item_3', label: 'Service Role (私钥)', value: 'secret_key_here...', type: 'password', x: 3050, y: 3350 },
        ]
      },
      {
        id: 'group_2',
        name: 'Itch.io 部署',
        items: [
          { id: 'item_4', label: 'Butler 推送命令', value: 'butler push build/ user/game:channel', type: 'code', x: 3072, y: 3150 },
        ]
      }
    ]
  },
  {
    id: 'proj_2',
    name: 'Claude AI 集成',
    icon: 'Bot',
    groups: [
      {
        id: 'group_3',
        name: 'API 密钥',
        items: [
          { id: 'item_5', label: 'Anthropic API Key', value: 'sk-ant-api03-...', type: 'password', x: 3072, y: 3100 },
        ]
      },
      {
        id: 'group_4',
        name: '系统提示词 (Prompts)',
        items: [
          { id: 'item_6', label: '代码专家设定', value: '你是一位资深的 React 工程师，擅长...', type: 'text', x: 3072, y: 3150 },
        ]
      }
    ]
  }
];
