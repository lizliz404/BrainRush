import { AvatarConfig } from '../types';

export type PlayerMood = 'idle' | 'happy' | 'hurt' | 'miss' | 'waiting';

// 内部角色类型枚举，方便做深度定制
type CharClass = 'runner' | 'ninja' | 'skater' | 'robot' | 'astronaut' | 'scientist' | 'hero' | 'boss';

// 升级版调色板，支持主色、阴影色、高光色
interface ColorDef {
  main: string;
  dark: string;
  light: string;
}

interface PlayerPalette {
  skin: ColorDef;
  hair: ColorDef;
  suit: ColorDef;
  pants: ColorDef;
  shoe: ColorDef;
  accent: ColorDef;
}

// 辅助函数：根据十六进制生成明暗颜色
const shade = (hex: string, amount: number): string => {
  let color = hex.replace('#', '');
  if (color.length === 3) color = color.split('').map(c => c + c).join('');
  const num = parseInt(color, 16);
  let r = (num >> 16) + amount;
  let g = ((num >> 8) & 0x00FF) + amount;
  let b = (num & 0x0000FF) + amount;
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  return `#${(g | (b << 8) | (r << 16)).toString(16).padStart(6, '0')}`;
};

const makeColor = (hex: string): ColorDef => ({
  main: hex,
  dark: shade(hex, -40),
  light: shade(hex, 40),
});

// 获取角色配置
const getCharConfig = (avatar: AvatarConfig): { char: CharClass; p: PlayerPalette } => {
  let char: CharClass = 'runner';
  let p: PlayerPalette = {
    skin: makeColor('#f8c8a4'),
    hair: makeColor('#475569'),
    suit: makeColor('#0ea5e9'),
    pants: makeColor('#1e293b'),
    shoe: makeColor('#f1f5f9'),
    accent: makeColor('#f59e0b'),
  };

  // 根据分数解锁规则的 Emoji 判定职业并赋予专属色彩体系
  if (avatar.head === '😈') {
    char = 'boss';
    p.skin = makeColor('#c084fc');
    p.hair = makeColor('#0f172a');
    p.suit = makeColor('#9f1239');
    p.accent = makeColor('#f43f5e');
    p.pants = makeColor('#4c0519');
    p.shoe = makeColor('#000000');
  } else if (avatar.head === '🦸' || avatar.body === '⚡') {
    char = 'hero';
    p.suit = makeColor('#2563eb');
    p.accent = makeColor('#ef4444'); // 红色披风
    p.shoe = makeColor('#b45309');
  } else if (avatar.head === '🧠') {
    char = 'scientist';
    p.suit = makeColor('#f8fafc');
    p.pants = makeColor('#64748b');
    p.hair = makeColor('#e2e8f0');
    p.accent = makeColor('#22c55e'); // 绿色试剂
  } else if (avatar.head === '👩‍🚀') {
    char = 'astronaut';
    p.suit = makeColor('#f1f5f9');
    p.pants = makeColor('#e2e8f0');
    p.shoe = makeColor('#94a3b8');
    p.accent = makeColor('#fbbf24'); // 金色面罩
  } else if (avatar.head === '🤖') {
    char = 'robot';
    p.skin = makeColor('#94a3b8');
    p.hair = makeColor('#cbd5e1');
    p.suit = makeColor('#475569');
    p.accent = makeColor('#06b6d4'); // 霓虹蓝光
  } else if (avatar.head === '😎') {
    char = 'skater';
    p.suit = makeColor('#f97316');
    p.pants = makeColor('#431407');
    p.shoe = makeColor('#38bdf8'); // 滑板色
  } else if (avatar.head === '🥷') {
    char = 'ninja';
    p.skin = makeColor('#f8c8a4'); // 仅眼部露出
    p.suit = makeColor('#111827');
    p.pants = makeColor('#030712');
    p.hair = makeColor('#111827');
    p.accent = makeColor('#be123c'); // 红色绑带
  }
  
  return { char, p };
};

export interface DrawPixelPlayerOptions {
  x: number;
  y: number;
  size: number;
  avatar: AvatarConfig;
  mood?: PlayerMood;
  timeMs?: number;
}

export const drawPixelPlayer = (
  ctx: CanvasRenderingContext2D,
  { x, y, size, avatar, mood = 'idle', timeMs = 0 }: DrawPixelPlayerOptions,
) => {
  const { char, p } = getCharConfig(avatar);
  
  // ================= 动画计算引擎 =================
  const t = timeMs / 1000;
  
  // 1. Idle 呼吸动画 (正弦波)
  const isIdle = mood === 'idle';
  const breathe = isIdle ? Math.sin(t * 3) : 0;
  const chestBreathe = isIdle ? Math.round(breathe * 0.5) : 0;
  const headBreathe = isIdle ? Math.round(breathe * 1) : 0;
  
  // 2. 眨眼动画 (随机间隔)
  const isBlinking = isIdle && (t % 4 < 0.15 || (t % 7 > 0 && t % 7 < 0.15));
  
  // 3. Happy 跳跃动画
  const isHappy = mood === 'happy';
  // 弹跳抛物线
  const jumpBounce = isHappy ? Math.abs(Math.sin(t * Math.PI * 1.5)) * -8 : 0;
  const handsUp = isHappy ? -4 : 0;
  
  // 4. Hurt 受伤震动与萎缩
  const isHurt = mood === 'hurt';
  const shakeX = isHurt ? (Math.floor(t * 30) % 2 === 0 ? 1 : -1) : 0;
  const crouchY = isHurt ? 3 : 0; // 身体下蹲
  
  // 5. Miss 失落动画
  const isMiss = mood === 'miss';
  const droopY = isMiss ? 2 : 0; // 低头

  // 6. Waiting 待机动画（轻度呼吸 + 期待眨眼）。保持整体 anchor 固定，避免预览区“漂移”。
  const isWaiting = mood === 'waiting';
  const waitBounce = isWaiting ? Math.abs(Math.sin(t * 3)) * 1 : 0;
  const waitBlink = isWaiting && (t % 3.5 < 0.12);

  // Boss 专属悬浮动画
  const isBoss = char === 'boss';
  const floatY = isBoss && !isHurt && !isMiss ? Math.sin(t * 2) * 2 : 0;

  // ================= 坐标与网格系统 =================
  // 使用 32x32 的虚拟网格，能够刻画非常细腻的像素级角色
  const GRID_SIZE = 32;
  const unit = Math.max(1, size / GRID_SIZE);
  
  // 核心定位：将 32x32 网格中心对齐到传入的 x, y。Y轴稍微偏下以匹配 V1 视觉中心
  const originX = Math.round(x - 16 * unit);
  const originY = Math.round(y - 20 * unit);

  // 基础骨骼 Y 坐标
  const groundY = 30;
  let bodyY = 16 + crouchY + floatY + (isHappy ? jumpBounce : 0) + waitBounce;
  let headY = 4 + headBreathe + crouchY + droopY + floatY + (isHappy ? jumpBounce : 0) + waitBounce;
  let legY = 25 + floatY + (isHappy ? jumpBounce * 0.2 : 0);
  let armY = 16 + chestBreathe + crouchY + droopY + handsUp + floatY + (isHappy ? jumpBounce : 0) + waitBounce;

  // 绘图微调：如果是受伤状态，整体失去高光，并有红色 overlay
  const dim = isHurt ? 0.6 : 1; 
  
  // ================= 核心绘图辅助函数 =================
  const box = (bx: number, by: number, bw: number, bh: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(bx * unit, by * unit, bw * unit, bh * unit);
  };

  // 画带阴影的方块块 (2-tone)
  const block = (bx: number, by: number, bw: number, bh: number, colorDef: ColorDef) => {
    box(bx, by, bw, bh, colorDef.main);
    // 简单的右下阴影感
    box(bx + bw - 1, by, 1, bh, colorDef.dark);
    box(bx, by + bh - 1, bw, 1, colorDef.dark);
    // 左上高光
    if (!isHurt) {
      box(bx, by, 1, bh - 1, colorDef.light);
    }
  };

  // ================= 开始渲染 =================
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(originX, originY);
  
  // 受伤时的震动偏移
  if (shakeX !== 0) {
    ctx.translate(shakeX * unit, 0);
  }

  // 1. 动态地面阴影 (随跳跃高度和悬浮缩小，更真实)
  ctx.save();
  const shadowScale = isHappy ? Math.max(0.3, 1 + jumpBounce / 10) : (isBoss ? 0.7 : 1);
  ctx.globalAlpha = isHurt ? 0.1 : 0.25;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(16 * unit, groundY * unit, 7 * unit * shadowScale, 2 * unit * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. 角色背部饰品 (披风、背包、武士刀)
  if (char === 'hero') {
    // 物理结算飘动的披风
    const capeWave = Math.sin(t * 8) * 2;
    box(9, bodyY + 1, 14, 10, p.accent.dark); // 里布
    box(8, bodyY + 2, 16, 9, p.accent.main); // 外布
    box(7 - capeWave, bodyY + 6, 4, 6, p.accent.light); // 飘动角
    box(21 + capeWave, bodyY + 5, 4, 7, p.accent.main); 
  } else if (char === 'ninja') {
    // 交叉的武士刀
    box(9, bodyY - 2, 2, 8, '#334155');
    box(21, bodyY - 2, 2, 8, '#334155');
    box(8, bodyY - 4, 4, 2, '#94a3b8'); // 刀柄
  } else if (char === 'astronaut') {
    // 巨大的生命维持背包
    block(7, bodyY, 18, 11, p.shoe);
    box(10, bodyY + 2, 12, 4, '#cbd5e1'); // 细节纹理
  }

  // 3. 腿部与脚部 (如果不在跳跃中，腿踩实地面)
  const drawLegs = () => {
    // 左腿
    block(11, legY, 4, 4, p.pants);
    block(10, legY + 3, 5, 3, p.shoe); // 鞋
    // 右腿
    block(17, legY, 4, 4, p.pants);
    block(17, legY + 3, 5, 3, p.shoe);
    
    // 角色特殊脚部饰品
    if (char === 'skater') {
      // 踩着滑板
      const boardY = isHappy ? legY + 6 : groundY - 1;
      box(8, boardY, 16, 1, p.shoe.main);
      box(10, boardY + 1, 2, 1, '#64748b'); // 轮子
      box(20, boardY + 1, 2, 1, '#64748b');
    } else if (char === 'boss') {
      // 恶魔悬浮火焰特效
      box(11, legY + 5, 2, 2, '#ef4444');
      box(18, legY + 6, 2, 2, '#f59e0b');
      box(14, legY + 5, 4, 1, '#ef4444');
    }
  };
  drawLegs();

  // 4. 手臂 (后方)
  const drawArms = () => {
    if (isHappy) {
      // 欢呼举手
      block(7, armY - 2, 3, 6, p.suit);
      block(22, armY - 2, 3, 6, p.suit);
      box(7, armY - 4, 3, 2, p.skin.main); // 手掌
      box(22, armY - 4, 3, 2, p.skin.main);
    } else {
      // 正常下垂
      block(8, armY, 3, 7, p.suit);
      block(21, armY, 3, 7, p.suit);
      box(8, armY + 7, 3, 2, p.skin.main);
      box(21, armY + 7, 3, 2, p.skin.main);
    }
    
    // 科学家拿着荧光试管
    if (char === 'scientist' && !isHappy) {
      box(21, armY + 7, 3, 4, '#ffffff'); // 玻璃
      box(21, armY + 9, 3, 2, p.accent.main); // 绿色液体
      box(22, armY + 8, 1, 1, '#bbf7d0'); // 气泡
    }
  };

  // 5. 身体躯干
  const drawBody = () => {
    block(11, bodyY, 10, 9, p.suit);
    
    // 衣服胸前细节
    if (char === 'runner') {
      box(14, bodyY + 2, 4, 5, p.suit.light); // 运动背心条纹
    } else if (char === 'hero') {
      // 超人 S 标志 (黄色三角形基础)
      box(13, bodyY + 2, 6, 4, '#facc15');
      box(14, bodyY + 6, 4, 1, '#facc15');
      box(14, bodyY + 3, 4, 2, '#ef4444'); // 标志内部
    } else if (char === 'robot') {
      // 机器人仪表盘和电量
      box(13, bodyY + 2, 6, 5, '#1e293b');
      box(14, bodyY + 3, 4, 1, p.accent.main); // 能量条
      box(14, bodyY + 5, 1, 1, '#ef4444'); // 红灯
      box(17, bodyY + 5, 1, 1, '#22c55e'); // 绿灯
    } else if (char === 'scientist') {
      // 白大褂开襟
      box(15, bodyY, 2, 9, p.pants.main); // 露出的内衬
      box(16, bodyY, 1, 9, '#00000020'); // 领带/阴影
    } else if (char === 'ninja') {
      box(11, bodyY + 4, 10, 1, p.accent.main); // 红色腰带
      box(15, bodyY, 1, 5, p.suit.dark); // 道服开襟
    } else if (char === 'astronaut') {
      box(13, bodyY + 2, 6, 6, p.shoe.main); // 宇航服胸甲
      box(14, bodyY + 3, 2, 2, '#38bdf8'); // 维生仪表
    }
  };

  // 先画身体，再画手臂覆盖
  drawBody();
  drawArms();

  // 6. 头部与面部
  const drawHead = () => {
    // 脖子
    box(14, headY + 11, 4, 2, p.skin.dark);
    
    // 基础头部轮廓 (14x12)
    const hX = 9, hW = 14, hH = 12;
    block(hX, headY, hW, hH, p.skin);

    // 发型 / 头饰渲染
    if (char === 'runner') {
      // 基础短发 + 发带
      block(hX - 1, headY - 1, hW + 2, 4, p.hair);
      box(hX - 1, headY + 2, hW + 2, 2, '#ef4444'); // 红色运动发带
      box(hX, headY - 2, 4, 2, p.hair.main); // 呆毛
    } else if (char === 'ninja') {
      // 忍者面罩（只露出眼睛部分）
      block(hX, headY, hW, hH, p.suit);
      box(hX + 2, headY + 4, hW - 4, 4, p.skin.main); // 露出皮肤
      box(hX - 1, headY + 3, 2, 6, p.suit.dark); // 面罩折叠边缘
      box(hX + hW - 1, headY + 3, 2, 6, p.suit.dark);
      // 飘带
      const ribbon = Math.sin(t * 10) * 2;
      box(hX - 4 + ribbon, headY + 8, 4, 1, p.accent.main);
    } else if (char === 'skater') {
      // 反戴棒球帽
      block(hX, headY - 2, hW, 4, p.suit);
      box(hX - 3, headY, 3, 1, p.suit.main); // 帽舌朝后
      // 墨镜 (遮挡眼睛)
      box(hX + 1, headY + 4, hW - 2, 3, '#020617');
      box(hX + 2, headY + 4, 3, 1, '#ffffff80'); // 墨镜反光
    } else if (char === 'boss') {
      // 恶魔角
      box(hX - 2, headY - 3, 2, 4, '#ef4444');
      box(hX - 1, headY - 5, 1, 2, '#ef4444');
      box(hX + hW, headY - 3, 2, 4, '#ef4444');
      box(hX + hW, headY - 5, 1, 2, '#ef4444');
      // 头发
      box(hX, headY, hW, 3, p.hair.main);
    } else if (char === 'scientist') {
      // 爱因斯坦式爆炸头
      block(hX - 2, headY - 2, hW + 4, 5, p.hair);
      box(hX - 3, headY + 2, 3, 3, p.hair.main);
      box(hX + hW, headY + 2, 3, 3, p.hair.main);
      // 头上的护目镜
      box(hX + 2, headY - 1, hW - 4, 3, '#334155');
      box(hX + 3, headY, 3, 1, '#38bdf8');
      box(hX + 8, headY, 3, 1, '#38bdf8');
    } else if (char === 'hero') {
      // 经典超人油头
      block(hX, headY - 1, hW, 4, p.hair);
      box(hX + 10, headY + 2, 2, 2, p.hair.main); // 标志性下垂的一缕头发
    } else if (char === 'robot') {
      // 机器人方形金属头 + 天线
      block(hX, headY, hW, hH, p.skin); // 这里的皮肤是金属色
      box(15, headY - 3, 2, 3, p.hair.main); // 天线杆
      const antennaGlow = Math.sin(t * 10) > 0 ? '#ef4444' : '#991b1b';
      box(15, headY - 4, 2, 2, antennaGlow); // 天线红灯
      // 赛博朋克面甲
      box(hX + 2, headY + 3, hW - 4, 5, '#0f172a');
    } else if (char === 'astronaut') {
      // 宇航员大头盔
      block(hX - 2, headY - 3, hW + 4, hH + 5, p.suit);
      // 金色面罩
      block(hX, headY + 1, hW, 8, p.accent);
      box(hX + 2, headY + 2, 3, 2, '#ffffff'); // 面罩高光
    }

    // 面部表情系统 (眼睛和嘴巴)
    // 机器人和宇航员的面罩特殊处理
    if (char === 'astronaut') {
      // 宇航员在面罩里不画常规表情，画一个反光的笑脸或哭脸
      if (isMiss || isHurt) box(hX + 4, headY + 4, 6, 1, '#b45309');
    } else {
      const eyeColor = isHurt ? '#991b1b' : (char === 'robot' ? p.accent.main : '#0f172a');
      const eyeY = headY + 5;
      const eyeX1 = hX + 3;
      const eyeX2 = hX + 9;

      if (isHurt) {
        // X 眼睛
        box(eyeX1, eyeY, 1, 1, eyeColor); box(eyeX1 + 2, eyeY, 1, 1, eyeColor);
        box(eyeX1 + 1, eyeY + 1, 1, 1, eyeColor);
        box(eyeX1, eyeY + 2, 1, 1, eyeColor); box(eyeX1 + 2, eyeY + 2, 1, 1, eyeColor);
        
        box(eyeX2, eyeY, 1, 1, eyeColor); box(eyeX2 + 2, eyeY, 1, 1, eyeColor);
        box(eyeX2 + 1, eyeY + 1, 1, 1, eyeColor);
        box(eyeX2, eyeY + 2, 1, 1, eyeColor); box(eyeX2 + 2, eyeY + 2, 1, 1, eyeColor);
        // 苦涩的嘴
        box(14, eyeY + 4, 4, 1, '#0f172a');
        box(13, eyeY + 5, 1, 1, '#0f172a');
        box(18, eyeY + 5, 1, 1, '#0f172a');
      } else if (isMiss) {
        // 豆豆眼 + 大大张开的嘴巴 (滑稽感)
        box(eyeX1 + 1, eyeY, 2, 2, eyeColor);
        box(eyeX2 + 1, eyeY, 2, 2, eyeColor);
        box(14, eyeY + 3, 4, 4, '#0f172a'); // 张大的嘴巴
        box(15, eyeY + 5, 2, 2, '#ef4444'); // 舌头
      } else {
        // 正常 / Happy 眼睛
        if (isBlinking && !isHappy) {
          // 闭眼眨眼
          box(eyeX1, eyeY + 1, 3, 1, eyeColor);
          box(eyeX2, eyeY + 1, 3, 1, eyeColor);
        } else if (isHappy) {
          // 开心弧形眼 ^ ^
          if (char !== 'skater') { // skater 戴墨镜不画眼睛
            box(eyeX1, eyeY + 1, 1, 1, eyeColor);
            box(eyeX1 + 1, eyeY, 1, 1, eyeColor);
            box(eyeX1 + 2, eyeY + 1, 1, 1, eyeColor);
            
            box(eyeX2, eyeY + 1, 1, 1, eyeColor);
            box(eyeX2 + 1, eyeY, 1, 1, eyeColor);
            box(eyeX2 + 2, eyeY + 1, 1, 1, eyeColor);
          }
          // 大笑嘴巴
          box(13, eyeY + 3, 6, 1, '#0f172a');
          box(14, eyeY + 4, 4, 2, '#0f172a');
          box(15, eyeY + 4, 2, 1, '#ef4444');
        } else if (waitBlink) {
          // Waiting 状态闭眼（期待状）
          box(eyeX1, eyeY + 1, 3, 1, eyeColor);
          box(eyeX2, eyeY + 1, 3, 1, eyeColor);
          // 微微上扬的嘴角
          box(14, eyeY + 4, 4, 1, '#0f172a');
          box(13, eyeY + 3, 1, 1, '#0f172a');
          box(18, eyeY + 3, 1, 1, '#0f172a');
        } else {
          // 正常睁眼
          if (char !== 'skater') {
            box(eyeX1, eyeY, 2, 2, eyeColor);
            box(eyeX2, eyeY, 2, 2, eyeColor);
          }
          // 微微微笑
          box(14, eyeY + 4, 4, 1, '#0f172a');
          box(14, eyeY + 3, 1, 1, '#0f172a');
          box(17, eyeY + 3, 1, 1, '#0f172a');
        }
      }
    }
  };
  
  drawHead();

  // ================= 7. 粒子特效系统 (VFX) =================
  if (isMiss) {
    // 巨大的尴尬汗珠/眼泪，带有下落循环动画
    const dropY = (t * 15) % 8; 
    const dropScale = dropY > 6 ? 0 : 1; // 落地消失
    if (dropScale > 0) {
      box(21, headY + 2 + dropY, 2, 3, '#38bdf8');
      box(20, headY + 4 + dropY, 4, 2, '#38bdf8');
      box(21, headY + 4 + dropY, 1, 1, '#ffffff'); // 汗珠反光
    }
  }

  if (isHappy) {
    // 开心时的闪耀星星粒子，根据时间计算多个粒子的上升轨迹
    for (let i = 0; i < 3; i++) {
      const pT = (t * 2 + i * 1.3) % 2; // 粒子生命周期 0 -> 2
      const pX = i === 0 ? 6 : (i === 1 ? 26 : 16); // 左，右，中
      const pY = 25 - pT * 15; // 向上飘
      const alpha = pT > 1.5 ? (2 - pT) * 2 : 1; // 淡出
      
      ctx.globalAlpha = alpha;
      const pColor = i === 1 ? '#38bdf8' : '#facc15';
      box(pX, pY, 2, 2, pColor);
      box(pX - 1, pY + 0.5, 4, 1, pColor); // 十字星芒
      box(pX + 0.5, pY - 1, 1, 4, pColor);
      ctx.globalAlpha = 1;
    }
  }

  if (isHurt) {
    // 受伤时的红色碰撞星星/爆点
    const burstR = (t * 30) % 3;
    if (burstR < 2) {
      box(6, bodyY, 2, 2, '#ef4444');
      box(24, headY, 2, 2, '#facc15');
    }
    // 覆盖全屏微红滤镜模拟闪烁
    if (Math.floor(t * 15) % 2 === 0) {
      ctx.globalAlpha = 0.3;
      box(0, 0, 32, 32, '#ef4444');
      ctx.globalAlpha = 1;
    }
  }

  ctx.restore();
};
