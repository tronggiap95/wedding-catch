import { COUPLE_NAMES, guestNameStore } from '../state/GuestNameStore';
import type { Locale } from '../i18n/types';

export type CoupleMood = 'good' | 'bad' | 'bonus' | 'specialBad';

interface CoupleLinePair {
  readonly bride: string;
  readonly groom: string;
}

type MoodBank = Record<CoupleMood, readonly CoupleLinePair[]>;

function fill(template: string): string {
  return template
    .replaceAll('{bride}', COUPLE_NAMES.bride)
    .replaceAll('{groom}', COUPLE_NAMES.groom)
    .replaceAll('{guest}', guestNameStore.getDisplayName());
}

const VI: MoodBank = {
  good: [
    { bride: 'Yay quà đẹp!', groom: 'Cảm ơn {guest}!' },
    { bride: 'Tim bay rồi!', groom: '{bride} cười xinh quá!' },
    { bride: 'Hứng chuẩn luôn!', groom: 'Đỉnh của chóp!' },
    { bride: 'Quà ngọt ghê!', groom: 'Thêm nữa đi!' },
    { bride: '{groom} ơi điểm lên!', groom: 'Anh bắt đẹp không?' },
    { bride: 'Combo nào!', groom: 'Không để rơi!' },
    { bride: 'Hạnh phúc quá!', groom: 'Mãi bên em!' },
    { bride: 'Lì xì về!', groom: 'Tủ lạnh gần lắm!' },
    { bride: 'Xinh như hoa!', groom: 'Em là nhất!' },
    { bride: 'Quà từ {guest}!', groom: 'Bạn thân chất!' },
    { bride: 'Hehe bắt được!', groom: 'Phối hợp đỉnh!' },
    { bride: 'Tim +1!', groom: 'Điểm +nữa!' },
    { bride: 'Ngọt như mật!', groom: 'Ngọt như {bride}!' },
    { bride: 'Rổ đầy dần!', groom: 'Cứ thế này!' },
    { bride: 'Ước mơ tới!', groom: 'Chúng ta làm được!' },
  ],
  bad: [
    { bride: 'Huhu đồ xấu!', groom: 'Xin lỗi em!' },
    { bride: 'Ớ... trượt rồi!', groom: 'Anh sẽ né tốt hơn!' },
    { bride: 'Đừng nữa mà!', groom: 'Ác quỷ ghê thật!' },
    { bride: 'Mất máu rồi!', groom: 'Cẩn thận em ơi!' },
    { bride: 'Huhu {groom}!', groom: 'Anh đây, bình tĩnh!' },
    { bride: 'Combo đứt rồi!', groom: 'Làm lại nào!' },
    { bride: 'Thối quá!', groom: 'Tránh xa đi!' },
    { bride: 'Sợ quá đi!', groom: 'Anh che cho em!' },
    { bride: 'Đừng tham nữa!', groom: 'Đúng rồi em!' },
    { bride: 'Huhu mạng ơi!', groom: 'Còn kịp cứu!' },
    { bride: 'Chuối gì vậy!', groom: 'Boom rồi!' },
    { bride: 'Xui quá đi!', groom: 'Vận đen tạm thôi!' },
  ],
  bonus: [
    { bride: 'Bonus trời cho!', groom: 'May quá {bride}!' },
    { bride: 'Nam châm nè!', groom: 'Hút quà thôi!' },
    { bride: 'Khiên sáng!', groom: 'Bất tử tạm thời!' },
    { bride: 'x2 điểm!', groom: 'Ăn đậm nào!' },
    { bride: 'Thiên thần dễ thương!', groom: 'Cảm ơn thiên sứ!' },
    { bride: 'Phước lành về!', groom: 'Lộc đầy nhà!' },
    { bride: 'Lung linh quá!', groom: 'Giữ nhịp nào!' },
    { bride: 'May mắn ập tới!', groom: 'Đừng bỏ lỡ!' },
  ],
  specialBad: [
    { bride: 'Ớ đỏ hết người!', groom: 'Debuff nặng!' },
    { bride: 'Nam châm xấu!', groom: 'Quà tốt bị đẩy!' },
    { bride: 'Say xỉn rồi!', groom: 'Điều khiển ngược!' },
    { bride: 'Huhu trạng thái xấu!', groom: 'Cố chịu {bride}!' },
    { bride: 'Ưu tiên xấu rồi!', groom: 'Bonus tốt tắt mất!' },
    { bride: 'Chóng mặt quá!', groom: 'Trái phải đảo rồi!' },
  ],
};

const EN: MoodBank = {
  good: VI.good.map((p) => ({
    bride: p.bride
      .replaceAll('Yay quà đẹp!', 'Yay pretty gift!')
      .replaceAll('Tim bay rồi!', 'My heart flies!')
      .replaceAll('Hứng chuẩn luôn!', 'Perfect catch!')
      .replaceAll('Quà ngọt ghê!', 'So sweet!')
      .replaceAll('ơi điểm lên!', ', score up!')
      .replaceAll('Combo nào!', 'Combo time!')
      .replaceAll('Hạnh phúc quá!', 'So happy!')
      .replaceAll('Lì xì về!', 'Lucky money!')
      .replaceAll('Xinh như hoa!', 'Pretty as a flower!')
      .replaceAll('Quà từ', 'Gift from')
      .replaceAll('Hehe bắt được!', 'Hehe got it!')
      .replaceAll('Tim +1!', 'Heart +1!')
      .replaceAll('Ngọt như mật!', 'Sweet as honey!')
      .replaceAll('Rổ đầy dần!', 'Basket filling!')
      .replaceAll('Ước mơ tới!', 'Dreams coming!'),
    groom: p.groom
      .replaceAll('Cảm ơn', 'Thanks')
      .replaceAll('cười xinh quá', 'smiles so bright')
      .replaceAll('Đỉnh của chóp!', 'Top tier!')
      .replaceAll('Thêm nữa đi!', 'More please!')
      .replaceAll('Anh bắt đẹp không?', 'Nice catch, right?')
      .replaceAll('Không để rơi!', "Won't drop it!")
      .replaceAll('Mãi bên em!', 'Forever with you!')
      .replaceAll('Tủ lạnh gần lắm!', 'Fridge is close!')
      .replaceAll('Em là nhất!', "You're the best!")
      .replaceAll('Bạn thân chất!', 'Best guest ever!')
      .replaceAll('Phối hợp đỉnh!', 'Perfect teamwork!')
      .replaceAll('Điểm +nữa!', 'More points!')
      .replaceAll('Ngọt như', 'Sweet like')
      .replaceAll('Cứ thế này!', 'Keep it up!')
      .replaceAll('Chúng ta làm được!', 'We got this!'),
  })),
  bad: VI.bad.map((p) => ({
    bride: p.bride
      .replaceAll('Huhu đồ xấu!', 'Oh no, bad item!')
      .replaceAll('Ớ... trượt rồi!', 'Oops... missed!')
      .replaceAll('Đừng nữa mà!', 'Please stop!')
      .replaceAll('Mất máu rồi!', 'We lost a life!')
      .replaceAll('Combo đứt rồi!', 'Combo broken!')
      .replaceAll('Thối quá!', 'So gross!')
      .replaceAll('Sợ quá đi!', 'So scary!')
      .replaceAll('Đừng tham nữa!', 'No more greed!')
      .replaceAll('Huhu mạng ơi!', 'Oh my lives!')
      .replaceAll('Chuối gì vậy!', 'Banana peel?!')
      .replaceAll('Xui quá đi!', 'So unlucky!'),
    groom: p.groom
      .replaceAll('Xin lỗi em!', 'Sorry love!')
      .replaceAll('Anh sẽ né tốt hơn!', "I'll dodge better!")
      .replaceAll('Ác quỷ ghê thật!', 'That devil is mean!')
      .replaceAll('Cẩn thận em ơi!', 'Careful, love!')
      .replaceAll('Anh đây, bình tĩnh!', "I'm here, calm down!")
      .replaceAll('Làm lại nào!', "Let's reset!")
      .replaceAll('Tránh xa đi!', 'Stay away!')
      .replaceAll('Anh che cho em!', "I've got you!")
      .replaceAll('Đúng rồi em!', "You're right!")
      .replaceAll('Còn kịp cứu!', 'Still salvageable!')
      .replaceAll('Boom rồi!', 'Boom!')
      .replaceAll('Vận đen tạm thôi!', 'Bad luck is temporary!'),
  })),
  bonus: VI.bonus.map((p) => ({
    bride: p.bride
      .replaceAll('Bonus trời cho!', 'Heaven bonus!')
      .replaceAll('Nam châm nè!', 'Magnet time!')
      .replaceAll('Khiên sáng!', 'Bright shield!')
      .replaceAll('x2 điểm!', 'x2 score!')
      .replaceAll('Thiên thần dễ thương!', 'Cute angel!')
      .replaceAll('Phước lành về!', 'Blessings incoming!')
      .replaceAll('Lung linh quá!', 'So sparkly!')
      .replaceAll('May mắn ập tới!', 'Luck arrives!'),
    groom: p.groom
      .replaceAll('May quá', 'Lucky')
      .replaceAll('Hút quà thôi!', 'Suck gifts in!')
      .replaceAll('Bất tử tạm thời!', 'Temp invincible!')
      .replaceAll('Ăn đậm nào!', 'Feast time!')
      .replaceAll('Cảm ơn thiên sứ!', 'Thanks, angel!')
      .replaceAll('Lộc đầy nhà!', 'Fortune at home!')
      .replaceAll('Giữ nhịp nào!', 'Keep the rhythm!')
      .replaceAll('Đừng bỏ lỡ!', "Don't miss it!"),
  })),
  specialBad: VI.specialBad.map((p) => ({
    bride: p.bride
      .replaceAll('Ớ đỏ hết người!', 'We turned all red!')
      .replaceAll('Nam châm xấu!', 'Bad magnet!')
      .replaceAll('Say xỉn rồi!', "We're drunk!")
      .replaceAll('Huhu trạng thái xấu!', 'Nasty debuff!')
      .replaceAll('Ưu tiên xấu rồi!', 'Bad status wins!')
      .replaceAll('Chóng mặt quá!', 'So dizzy!'),
    groom: p.groom
      .replaceAll('Debuff nặng!', 'Heavy debuff!')
      .replaceAll('Quà tốt bị đẩy!', 'Goods pushed away!')
      .replaceAll('Điều khiển ngược!', 'Controls reversed!')
      .replaceAll('Cố chịu', 'Hang in there')
      .replaceAll('Bonus tốt tắt mất!', 'Good bonus gone!')
      .replaceAll('Trái phải đảo rồi!', 'Left-right flipped!'),
  })),
};

const ZH: MoodBank = {
  good: VI.good.map((p) => ({
    bride: p.bride
      .replaceAll('Yay quà đẹp!', '耶，礼物真美！')
      .replaceAll('Tim bay rồi!', '心飞起来了！')
      .replaceAll('Hứng chuẩn luôn!', '接得漂亮！')
      .replaceAll('Quà ngọt ghê!', '好甜呀！')
      .replaceAll('ơi điểm lên!', '，分数涨！')
      .replaceAll('Combo nào!', '连击加油！')
      .replaceAll('Hạnh phúc quá!', '好幸福！')
      .replaceAll('Lì xì về!', '红包来了！')
      .replaceAll('Xinh như hoa!', '美得像花！')
      .replaceAll('Quà từ', '礼物来自')
      .replaceAll('Hehe bắt được!', '嘿嘿接到了！')
      .replaceAll('Tim +1!', '爱心+1！')
      .replaceAll('Ngọt như mật!', '甜如蜜！')
      .replaceAll('Rổ đầy dần!', '篮子快满了！')
      .replaceAll('Ước mơ tới!', '梦想来了！'),
    groom: p.groom
      .replaceAll('Cảm ơn', '谢谢')
      .replaceAll('cười xinh quá', '笑得好甜')
      .replaceAll('Đỉnh của chóp!', '太强了！')
      .replaceAll('Thêm nữa đi!', '再来！')
      .replaceAll('Anh bắt đẹp không?', '我接得帅吗？')
      .replaceAll('Không để rơi!', '绝不漏接！')
      .replaceAll('Mãi bên em!', '永远陪你！')
      .replaceAll('Tủ lạnh gần lắm!', '冰箱不远了！')
      .replaceAll('Em là nhất!', '你最棒！')
      .replaceAll('Bạn thân chất!', '嘉宾给力！')
      .replaceAll('Phối hợp đỉnh!', '配合满分！')
      .replaceAll('Điểm +nữa!', '再加分！')
      .replaceAll('Ngọt như', '甜得像')
      .replaceAll('Cứ thế này!', '就这样！')
      .replaceAll('Chúng ta làm được!', '我们行的！'),
  })),
  bad: VI.bad.map((p) => ({
    bride: p.bride
      .replaceAll('Huhu đồ xấu!', '呜呜坏东西！')
      .replaceAll('Ớ... trượt rồi!', '哎呀…漏了！')
      .replaceAll('Đừng nữa mà!', '别再来了！')
      .replaceAll('Mất máu rồi!', '掉血了！')
      .replaceAll('Combo đứt rồi!', '连击断了！')
      .replaceAll('Thối quá!', '好臭！')
      .replaceAll('Sợ quá đi!', '好怕！')
      .replaceAll('Đừng tham nữa!', '别贪了！')
      .replaceAll('Huhu mạng ơi!', '呜呜命啊！')
      .replaceAll('Chuối gì vậy!', '香蕉皮？！')
      .replaceAll('Xui quá đi!', '好倒霉！'),
    groom: p.groom
      .replaceAll('Xin lỗi em!', '对不起！')
      .replaceAll('Anh sẽ né tốt hơn!', '我会躲更好！')
      .replaceAll('Ác quỷ ghê thật!', '恶魔好凶！')
      .replaceAll('Cẩn thận em ơi!', '小心点！')
      .replaceAll('Anh đây, bình tĩnh!', '我在，别慌！')
      .replaceAll('Làm lại nào!', '再来！')
      .replaceAll('Tránh xa đi!', '离远点！')
      .replaceAll('Anh che cho em!', '我护着你！')
      .replaceAll('Đúng rồi em!', '你说得对！')
      .replaceAll('Còn kịp cứu!', '还能救！')
      .replaceAll('Boom rồi!', '炸了！')
      .replaceAll('Vận đen tạm thôi!', '霉运会过去！'),
  })),
  bonus: VI.bonus.map((p) => ({
    bride: p.bride
      .replaceAll('Bonus trời cho!', '天上奖励！')
      .replaceAll('Nam châm nè!', '磁铁来了！')
      .replaceAll('Khiên sáng!', '闪亮护盾！')
      .replaceAll('x2 điểm!', '双倍分数！')
      .replaceAll('Thiên thần dễ thương!', '天使好可爱！')
      .replaceAll('Phước lành về!', '祝福降临！')
      .replaceAll('Lung linh quá!', '好闪亮！')
      .replaceAll('May mắn ập tới!', '好运来了！'),
    groom: p.groom
      .replaceAll('May quá', '太幸运了')
      .replaceAll('Hút quà thôi!', '吸礼物！')
      .replaceAll('Bất tử tạm thời!', '暂时无敌！')
      .replaceAll('Ăn đậm nào!', '大吃特吃！')
      .replaceAll('Cảm ơn thiên sứ!', '谢谢天使！')
      .replaceAll('Lộc đầy nhà!', '好运满屋！')
      .replaceAll('Giữ nhịp nào!', '稳住节奏！')
      .replaceAll('Đừng bỏ lỡ!', '别错过！'),
  })),
  specialBad: VI.specialBad.map((p) => ({
    bride: p.bride
      .replaceAll('Ớ đỏ hết người!', '全身变红了！')
      .replaceAll('Nam châm xấu!', '坏磁铁！')
      .replaceAll('Say xỉn rồi!', '喝醉了！')
      .replaceAll('Huhu trạng thái xấu!', '负面状态！')
      .replaceAll('Ưu tiên xấu rồi!', '坏状态优先！')
      .replaceAll('Chóng mặt quá!', '好晕！'),
    groom: p.groom
      .replaceAll('Debuff nặng!', '重减益！')
      .replaceAll('Quà tốt bị đẩy!', '好物被推开！')
      .replaceAll('Điều khiển ngược!', '操作反了！')
      .replaceAll('Cố chịu', '撑住')
      .replaceAll('Bonus tốt tắt mất!', '好奖励没了！')
      .replaceAll('Trái phải đảo rồi!', '左右颠倒！'),
  })),
};

const BANKS: Record<Locale, MoodBank> = { vi: VI, en: EN, zh: ZH };

export function pickCoupleLines(
  locale: Locale,
  mood: CoupleMood,
): CoupleLinePair {
  const pool = BANKS[locale][mood];
  const picked = pool[Math.floor(Math.random() * pool.length)] ?? pool[0]!;
  return {
    bride: fill(picked.bride),
    groom: fill(picked.groom),
  };
}
