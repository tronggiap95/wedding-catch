import type { Locale } from '../i18n/types';
import { COUPLE_NAMES, guestNameStore } from '../state/GuestNameStore';

export type ThrowerDialogueRole = 'devil' | 'guest' | 'angel';

type LineBank = Record<ThrowerDialogueRole, readonly string[]>;

function interpolate(template: string): string {
  return template
    .replaceAll('{bride}', COUPLE_NAMES.bride)
    .replaceAll('{groom}', COUPLE_NAMES.groom)
    .replaceAll('{guest}', guestNameStore.getDisplayName());
}

const VI: LineBank = {
  guest: [
    '{guest} mang quà cho {bride} đây!',
    '{groom} ơi bắt lấy!',
    'Chúc {bride} & {groom} trăm năm hạnh phúc!',
    'Quà từ {guest} nè!',
    '{bride} xinh quá trời!',
    '{groom} hứng đỉnh luôn!',
    '{guest} ném chuẩn cho hai bạn!',
    'Ê {bride}, quà bay tới!',
    '{groom} đừng miss nha!',
    '{guest} chúc mau có tin vui!',
    'Lì xì cho {bride} đây!',
    'Tim bay tới {groom}!',
    'Hoa hồng tặng {bride}!',
    'Mừng cưới {bride} & {groom}!',
    '{guest} đứng đây ném quà nè!',
    '{bride} ơi combo lên nào!',
    '{groom} tay bắt mắt nhìn!',
    'Quà ý nghĩa từ {guest}!',
    '{bride} & {groom} đẹp đôi quá!',
    'Ném nhẹ cho {bride} nha~',
    '{groom} bắt không trượt!',
    '{guest} hóng hai bạn hứng quà!',
    'Chúc {bride} sống vui!',
    'Chúc {groom} sống khỏe!',
    '{guest} ném hết mình!',
    'Quà hot cho {bride}!',
    '{groom} ơi một món nữa!',
    '{guest} vỗ tay cho hai bạn!',
    'Ăn no quà nha {bride}!',
    '{groom} đừng chểnh mảng!',
    '{guest} tặng bạn trẻ!',
    'Ném xong {guest} đi ăn bánh!',
    '{bride} hứng siêu nhanh!',
    '{groom} hứng siêu đẹp!',
    'Quà bất ngờ từ {guest}!',
    '{bride} ơi quà tới nơi!',
    '{groom} cứ trung thành nhé!',
    'Mãi bên nhau {bride} & {groom}!',
    '{guest} ném vui vui!',
    '{bride} hứng hăng say!',
    'Quà lung linh cho {groom}!',
    'Chúc {bride} viên mãn!',
    '{guest} nhiệt huyết quá!',
    'Tay nhanh hơn mắt {groom}!',
    'Đừng để quà rơi {bride}!',
    'Ê {guest} quà đây!',
    'Bắt đi rồi cười {groom}!',
    'Quà siêu xinh cho {bride}!',
    'Chúc ngọt ngào {bride} & {groom}!',
    '{guest} ném ngọt xớt!',
    '{bride} hứng ngọt luôn!',
    'Có lì xì ảo từ {guest}!',
    'Chúc ngọt đời {groom}!',
    '{guest} ném vui nhộn!',
    '{bride} hứng vui nhộn!',
    'Rổ chưa đầy đâu {groom}!',
    'Chúc đáng yêu {bride}!',
    '{guest} ném hết ý!',
    '{bride} hứng hết ý!',
    'Quà hết ý từ {guest}!',
    'Chúc hết ý {groom}!',
    '{guest} ném nữa nè!',
    '{bride} hứng nữa đi!',
    'Quà nữa đây {groom}!',
    'Chúc nữa nha {bride}!',
    '{guest} ném cuối chưa?',
    '{bride} hứng tới bến!',
    'Quà tới bến {groom}!',
    'Chúc tới bến {bride} & {groom}!',
    '{guest} ném nhiệt liệt!',
    'Ai ơi hứng với {guest}!',
    'Quà không đợi người {bride}!',
    'Chúc sớm đoàn viên {groom}!',
    '{guest} ném chuẩn soái!',
    '{bride} hứng chuẩn soái!',
    '{groom} ơi nhìn {guest} nè!',
    'Quà đây rồi {bride} ơi!',
    '{guest} gửi lời chúc tới {groom}!',
    'Hai bạn {bride} {groom} cố lên!',
    '{guest} đứng giữa sân khấu!',
    'Ném quà mừng {bride}!',
    'Ném quà mừng {groom}!',
    '{bride} cười xinh quá!',
    '{groom} cool quá!',
    '{guest} tự hào hai bạn!',
    'Quà bay chậm cho {bride}!',
    '{groom} đón chuẩn rồi!',
    '{guest} chơi hết mình!',
    'Chúc phúc từ {guest}!',
    '{bride} & {groom} mãi yêu nhau!',
    'Một trái tim cho {bride}!',
    'Một nụ hôn gió tới {groom}!',
    '{guest} hô to: hạnh phúc!',
    'Quà ngon cho {bride}!',
    '{groom} ơi đỉnh của chóp!',
    '{guest} ném không trượt!',
    '{bride} bắt đẹp quá!',
    'Tiệc cưới vui nhờ {guest}!',
    '{bride} Minh Thy ơi!',
    '{groom} Trọng Giáp ơi!',
  ],
  devil: [
    'Hehe {bride} né đi!',
    '{groom} hứng được không?',
    'Đồ xấu cho {bride} đây!',
    'Tránh ra nào {groom}!',
    'Chuối nè {bride}~',
    'Boom {groom}!',
    '{bride} mắc bẫy chưa?',
    'Ác chút thôi {groom}!',
    'Đừng hứng {bride}!',
    'Hihi {guest} cũng sợ anh!',
    'Ném phá đám {bride} & {groom}!',
    'Quà độc cho {groom}!',
    'Sợ chưa {bride}?',
    'Né đi {groom}!',
    'Trượt đi nào {bride}!',
    'Ác quỷ tới rồi {groom}!',
    'Đồ hỏng nè {bride}!',
    'Tay {groom} run rồi?',
    'Hứng là khóc {bride}!',
    'Troll nhẹ {groom} thôi!',
    'Bẫy đây rồi {bride}!',
    'Đừng tham {groom}!',
    'Quà giả cho {bride}!',
    'Ném lén {groom}!',
    'Ác nhưng cute với {bride}!',
    'Hehe miss đi {groom}!',
    'Đồ đen đủi {bride}!',
    'Phá combo của {groom}!',
    'Hứng = trừ máu {bride}!',
    'Cẩn thận {groom}!',
    'Ác một tí {bride}!',
    'Quà kinh dị tới {groom}!',
    'Nhanh lắm đó {bride}!',
    'Né không kịp {groom}!',
    'Hihihi {bride}!',
    'Thối phức {groom}!',
    'Đừng tham nữa {bride}!',
    'Rủi lắm nha {groom}!',
    'Độc lắm đó {bride}!',
    'Ác quỷ mode vs {groom}!',
    'Bẫy mở {bride}!',
    'Troll unlocked {groom}!',
    'Miss giúp anh {bride}!',
    'Né đi rồi cười {groom}!',
    'Khóc nhẹ thôi {bride}!',
    'Ném độc địa {groom}!',
    'Ai dám hứng {bride}?',
    'Quà độc địa {groom}!',
    'Ác độc địa {bride}!',
    'Hehe sắp dính {groom}!',
    'Sắp mất mạng {bride}!',
    'Combo {groom} run rẩy!',
    'Sắp khóc thét {bride}!',
    'Sắp né hụt {groom}!',
    'Xui xẻo tới {bride}!',
    'Ném xui {groom}!',
    'Hứng xui {bride}!',
    'Quà xui {groom}!',
    'Ác xui {bride}!',
    'Troll xui {groom}!',
    'Miss giúp tiệc {bride}!',
    'Né giúp anh {groom}!',
    'Khóc cũng cute {bride}!',
    'Boom vui vẻ {groom}!',
    'Chuối bay {bride}!',
    'Bom bay {groom}!',
    'Rắn bay {bride}!',
    'Cà chua bay {groom}!',
    'Gạch bay {bride}!',
    'Phá tiệc nhẹ {groom}!',
    'Hứng phá tiệc {bride}!',
    'Quà phá tiệc {groom}!',
    'Ác phá tiệc {bride}!',
    'Hehe đừng bắt {groom}!',
    'Tham là chết {bride}!',
    'Đứng đó chi {groom}?',
    'Đừng tin anh {bride}!',
    'Đừng hứng nữa {groom}!',
    'Ác nhưng vui {bride}!',
    'Ném cho vui {groom}!',
    'Troll cho vui {bride}!',
    'Bẫy cho vui {groom}!',
    'Miss cho vui {bride}!',
    'Quà đen tối {groom}!',
    'Ném đen tối {bride}!',
    'Hứng đen tối {groom}!',
    'Ác đen tối {bride}!',
    'Boom cuối {groom}!',
    'Miss cuối {bride}!',
    'Khóc cuối {groom}!',
    'Né cuối {bride}!',
    'Hehe cuối {groom}!',
    '{bride} ơi đừng tham!',
    '{groom} ơi né nhanh!',
    'Ác quỷ ghét hạnh phúc {bride} & {groom}!',
    'Trọng Giáp run chưa?',
    'Minh Thy sợ chưa?',
    'Hehe phá đám cưới!',
    'Đồ xấu cho cặp đôi!',
    'Né đi {guest} cũng hú hồn!',
  ],
  angel: [
    'Phước lành tới {bride}!',
    'Bonus cho {groom} đây!',
    'Chúc bình an {bride} & {groom}!',
    'Hứng đi nào {groom}!',
    'Quà trời cho {bride}!',
    'Nam châm giúp {groom} nè!',
    'Khiên sáng cho {bride}!',
    'x2 điểm {groom} ơi!',
    'Thiên thần trợ {bride}!',
    'May mắn nhé {groom}!',
    'Ánh sáng tới {bride}!',
    'Quà thiêng cho {groom}!',
    'Hứng may mắn {bride}!',
    'Chúc viên mãn {groom}!',
    'Bay nhẹ nhàng {bride}!',
    'Bonus ngọt {groom}!',
    'Đừng bỏ lỡ {bride}!',
    'Quà thiên đường {groom}!',
    'Hứng thần kỳ {bride}!',
    'Chúc hạnh phúc {bride} & {groom}!',
    'Ngôi sao cho {bride}!',
    'Lộc trời tới {groom}!',
    'Ném êm ái {bride}!',
    'Hứng êm ái {groom}!',
    'Phép màu đây {bride}!',
    'Chúc an nhiên {groom}!',
    'Bonus lung linh {bride}!',
    'Hứng lung linh {groom}!',
    'Thiên thần đây {bride}!',
    'Trợ giúp nè {groom}!',
    'May mắn tới {bride}!',
    'Quà may mắn {groom}!',
    'Chúc bình yên {bride}!',
    'Ném bình yên {groom}!',
    'Ánh sáng vàng {bride}!',
    'Ném ánh sáng {groom}!',
    'Phước lành bay {bride}!',
    'Bonus bay {groom}!',
    'May mắn bay {bride}!',
    'Khiên bay {groom}!',
    'Nam châm bay {bride}!',
    'Hứng để vui {groom}!',
    'Ném để vui {bride}!',
    'Quà để vui {groom}!',
    'Thiên đường gọi {bride}!',
    'Phép màu gọi {groom}!',
    'May mắn gọi {bride}!',
    'Ánh sáng gọi {groom}!',
    'Bonus siêu đẹp {bride}!',
    'Hứng siêu đẹp {groom}!',
    'Khiên cầu vồng {bride}!',
    'Điểm nhân đôi {groom}!',
    'Hút quà tốt {bride}!',
    'Đừng sợ đồ xấu {groom}!',
    'Cứ tin em {bride}!',
    'Em giúp nè {groom}!',
    'Trời thương {bride} & {groom}!',
    'Lộc đầy nhà hai bạn!',
    'Hạnh phúc nhé {bride}!',
    'Yêu thương nhé {groom}!',
    'Bonus cuối {bride}!',
    'May cuối {groom}!',
    'Phước cuối {bride}!',
    'Ánh sáng cuối {groom}!',
    'Hứng đi em {bride}!',
    'Ném đi em {groom}!',
    'Êm như mây {bride}!',
    'Nhẹ như gió {groom}!',
    'Sáng như sao {bride}!',
    'Ngọt như mật {groom}!',
    'Ấm như nắng {bride}!',
    'Phước bất tận {groom}!',
    'May bất tận {bride}!',
    'Yêu bất tận {groom}!',
    'Vui bất tận {bride}!',
    'Lành bất tận {groom}!',
    'Bonus bất tận {bride}!',
    '{bride} Minh Thy ơi nhận phước!',
    '{groom} Trọng Giáp ơi nhận lộc!',
    'Thiên thần luôn bên {bride} & {groom}!',
    'Quà trời không bỏ lỡ {groom}!',
    'Em ném ít nên nói nhiều {bride}!',
    'Nghe em này {groom}!',
    'Phước lành nhân đôi {bride}!',
    'Khiên che {groom} nè!',
    'Nam châm hút quà cho {bride}!',
    'x2 điểm cho {groom} cố lên!',
    'Đừng sợ ác quỷ {bride}!',
    'Em phù hộ {groom}!',
    'Ánh sáng đẩy xui {bride}!',
    'May mắn phủ {groom}!',
    'Bonus dành riêng {bride}!',
    'Thiên thần gọi tên {groom}!',
    'Chúc trăm năm {bride} & {groom}!',
    'Quà thiêng cuối {bride}!',
    'Bay nhẹ tới {groom}!',
    '{guest} ơi cổ vũ {bride} đi!',
    'Lộc về nhà {bride} & {groom}!',
    'Em thì thầm: yêu thương mãi!',
    'Phước lành phủ sân khấu!',
  ],
};

const EN: LineBank = {
  guest: VI.guest.map((line) =>
    line
      .replaceAll('mang quà cho', 'brings gifts for')
      .replaceAll('ơi bắt lấy', ', catch it')
      .replaceAll('Chúc', 'Bless')
      .replaceAll('trăm năm hạnh phúc', 'forever happiness')
      .replaceAll('Quà từ', 'Gift from')
      .replaceAll('xinh quá trời', 'looks gorgeous')
      .replaceAll('hứng đỉnh luôn', 'catches perfectly')
      .replaceAll('ném chuẩn cho hai bạn', 'throws for you two')
      .replaceAll('đừng miss nha', "don't miss")
      .replaceAll('chúc mau có tin vui', 'wishes you joy soon'),
  ),
  devil: VI.devil.map((line) =>
    line
      .replaceAll('né đi', 'dodge')
      .replaceAll('hứng được không', 'can you catch')
      .replaceAll('Đồ xấu cho', 'Bad loot for')
      .replaceAll('Tránh ra nào', 'Move aside')
      .replaceAll('Sợ chưa', 'Scared yet')
      .replaceAll('Né đi', 'Dodge')
      .replaceAll('Ác quỷ tới rồi', 'Devil arrives')
      .replaceAll('Hứng là khóc', 'Catch = cry'),
  ),
  angel: VI.angel.map((line) =>
    line
      .replaceAll('Phước lành tới', 'Blessings to')
      .replaceAll('Bonus cho', 'Bonus for')
      .replaceAll('Chúc bình an', 'Peace to')
      .replaceAll('Hứng đi nào', 'Catch it')
      .replaceAll('Quà trời cho', 'Heaven gift for')
      .replaceAll('Nam châm giúp', 'Magnet helps')
      .replaceAll('Khiên sáng cho', 'Shield for')
      .replaceAll('Thiên thần trợ', 'Angel assists')
      .replaceAll('May mắn nhé', 'Good luck')
      .replaceAll('Em ném ít nên nói nhiều', 'I throw less so I talk more'),
  ),
};

const ZH: LineBank = {
  guest: VI.guest.map((line) =>
    line
      .replaceAll('mang quà cho', '给')
      .replaceAll(' đây!', '送礼物！')
      .replaceAll('ơi bắt lấy!', '快接住！')
      .replaceAll('Chúc', '祝福')
      .replaceAll('trăm năm hạnh phúc', '百年好合')
      .replaceAll('Quà từ', '礼物来自')
      .replaceAll('xinh quá trời', '太美了')
      .replaceAll('hứng đỉnh luôn', '接得漂亮')
      .replaceAll('ném chuẩn cho hai bạn', '为你们投掷'),
  ),
  devil: VI.devil.map((line) =>
    line
      .replaceAll('né đi', '躲开')
      .replaceAll('hứng được không', '接得住吗')
      .replaceAll('Đồ xấu cho', '坏东西给')
      .replaceAll('Tránh ra nào', '让开')
      .replaceAll('Sợ chưa', '怕了吗')
      .replaceAll('Ác quỷ tới rồi', '恶魔来了')
      .replaceAll('Hứng là khóc', '接了就哭'),
  ),
  angel: VI.angel.map((line) =>
    line
      .replaceAll('Phước lành tới', '保佑')
      .replaceAll('Bonus cho', '奖励给')
      .replaceAll('Chúc bình an', '愿平安')
      .replaceAll('Hứng đi nào', '快接')
      .replaceAll('Quà trời cho', '天上礼物给')
      .replaceAll('Nam châm giúp', '磁铁帮')
      .replaceAll('Khiên sáng cho', '护盾给')
      .replaceAll('Thiên thần trợ', '天使助力')
      .replaceAll('May mắn nhé', '祝你好运')
      .replaceAll('Em ném ít nên nói nhiều', '我扔得少所以多说话'),
  ),
};

const BANKS: Record<Locale, LineBank> = { vi: VI, en: EN, zh: ZH };

export function pickThrowerLine(
  locale: Locale,
  role: ThrowerDialogueRole,
): string {
  const lines = BANKS[locale][role];
  const raw = lines[Math.floor(Math.random() * lines.length)] ?? '';
  return interpolate(raw);
}
