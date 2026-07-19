import { COUPLE_NAMES, guestNameStore } from '../state/GuestNameStore';
import type { Locale } from '../i18n/types';

export type CoupleMood = 'good' | 'bad' | 'bonus' | 'specialBad';

interface CoupleLinePair {
  readonly bride: string;
  readonly groom: string;
}

type MoodBank = Record<CoupleMood, readonly CoupleLinePair[]>;
type ItemBank = Readonly<Record<string, readonly CoupleLinePair[]>>;

function fill(template: string): string {
  return template
    .replaceAll('{bride}', COUPLE_NAMES.bride)
    .replaceAll('{groom}', COUPLE_NAMES.groom)
    .replaceAll('{guest}', guestNameStore.getDisplayName());
}

const VI_BAD_ITEMS: ItemBank = {
  banana: [
    { bride: 'Trượt vỏ chuối!', groom: 'Ai vứt đây vậy?' },
    { bride: 'Ùi té xém!', groom: 'Chuối độc quá!' },
    { bride: 'Huhu chân mềm!', groom: 'Né chậm mất rồi!' },
  ],
  torn_socks: [
    { bride: 'Tất rách gì đây?', groom: 'Không phải của anh!' },
    { bride: 'Hôi quá đi!', groom: 'Ném đi {bride}!' },
    { bride: 'Ew tất thủng!', groom: 'Quà ác quá!' },
  ],
  dried_fish: [
    { bride: 'Cá khô thối!', groom: 'Mùi gì kinh vậy?' },
    { bride: 'Huhu tanh quá!', groom: 'Đừng ngửi em!' },
    { bride: 'Cá gì kỳ vậy?', groom: 'Ác quỷ tặng chắc!' },
  ],
  empty_box: [
    { bride: 'Hộp trống trơn!', groom: 'Lừa đảo rồi!' },
    { bride: 'Mở ra... không có gì!', groom: 'Thất vọng quá!' },
    { bride: 'Hộp air à?', groom: 'Troll ghê!' },
  ],
  bomb: [
    { bride: 'Boom!!!', groom: 'Nổ tung rồi!' },
    { bride: 'Bom gì đây trời!', groom: 'Né không kịp!' },
    { bride: 'Huhu cháy tóc!', groom: 'Anh xin lỗi!' },
  ],
  chili: [
    { bride: 'Cay xé lưỡi!', groom: 'Ớt độc quá!' },
    { bride: 'Mặt đỏ hết!', groom: 'Uống nước mau!' },
    { bride: 'Huhu cay quá!', groom: 'Ai tặng ớt vậy?' },
  ],
  insult: [
    { bride: 'Chửi gì vậy?', groom: 'Đừng nghe em!' },
    { bride: 'Lời độc quá!', groom: 'Anh đứng đây!' },
    { bride: 'Huhu buồn!', groom: '{guest} đùa thôi mà!' },
  ],
  torn_underwear: [
    { bride: 'Á... cái gì vậy?!', groom: 'Không nhìn em!' },
    { bride: 'Xấu hổ chết!', groom: 'Ném xa đi!' },
    { bride: 'Huhu xấu hổ!', groom: 'Ai ác vậy trời!' },
  ],
  stock_crash: [
    { bride: 'Chứng khoán đỏ!', groom: 'Tài khoản khóc!' },
    { bride: 'Mất tiền rồi!', groom: 'Hold cũng lỗ!' },
    { bride: 'Huhu cháy túi!', groom: 'Đừng Fomo nữa!' },
  ],
  dead_mouse: [
    { bride: 'Chuột... chết?!', groom: 'Kinh dị quá!' },
    { bride: 'Huhu sợ chuột!', groom: 'Anh quét sạch!' },
    { bride: 'Ew ew ew!', groom: 'Ai troll vậy?' },
  ],
  tomato: [
    { bride: 'Cà chua đập mặt!', groom: 'Lễ hội cà chua à?' },
    { bride: 'Đỏ hết váy!', groom: 'Giặt giúp em!' },
    { bride: 'Huhu bẩn rồi!', groom: 'Ném lệch rồi!' },
  ],
  brick: [
    { bride: 'Gạch đập đầu!', groom: 'Nặng quá trời!' },
    { bride: 'Ối đau lưng!', groom: 'Ai xây nhà vậy?' },
    { bride: 'Huhu bầm rồi!', groom: 'Né chậm mất!' },
  ],
  expired_medicine: [
    { bride: 'Thuốc hết hạn!', groom: 'Đừng uống em!' },
    { bride: 'Huhu sợ bệnh!', groom: 'Vứt liền đi!' },
    { bride: 'Thuốc độc à?', groom: 'Ác quá đi!' },
  ],
  instant_noodles: [
    { bride: 'Mì tôm cưới?', groom: 'Tụi mình nghèo quá!' },
    { bride: 'Huhu mì gói!', groom: 'Mai ăn steak nhé!' },
    { bride: 'Quà gì kỳ!', groom: 'Chắc đùa thôi!' },
  ],
  empty_barrel: [
    { bride: 'Thùng rỗng tuếch!', groom: 'Không có xăng!' },
    { bride: 'Nặng mà trống!', groom: 'Lừa thật sự!' },
    { bride: 'Huhu mệt!', groom: 'Bỏ đi em!' },
  ],
  empty_wallet: [
    { bride: 'Ví không một xu!', groom: 'Anh cũng cháy túi!' },
    { bride: 'Huhu hết tiền!', groom: 'Còn tình là đủ!' },
    { bride: 'Ví flat rồi!', groom: 'Tháng sau tính!' },
  ],
  broken_phone: [
    { bride: 'Điện thoại nứt!', groom: 'Màn hình mạng nhện!' },
    { bride: 'Huhu máy hỏng!', groom: 'Bảo hiểm đâu rồi?' },
    { bride: 'Call không nổi!', groom: 'Đập rồi còn gì!' },
  ],
  snake: [
    { bride: 'Rắn!!!', groom: 'Đứng yên em!' },
    { bride: 'Huhu sợ rắn!', groom: 'Anh đuổi nó!' },
    { bride: 'Bò vào rổ!', groom: 'Quái vật gì vậy?' },
  ],
  rotten_egg: [
    { bride: 'Trứng thối!!!', groom: 'Mùi hủy diệt!' },
    { bride: 'Huhu ói tới!', groom: 'Bịt mũi em ơi!' },
    { bride: 'Thối xông trời!', groom: 'Ai ném trứng?' },
  ],
  stress: [
    { bride: 'Stress ập tới!', groom: 'Thở nào {bride}!' },
    { bride: 'Huhu áp lực!', groom: 'Anh ôm cái nào!' },
    { bride: 'Đầu muốn nổ!', groom: 'Chậm lại một chút!' },
  ],
  bad_magnet: [
    { bride: 'Nam châm ác!', groom: 'Quà tốt bị đẩy!' },
    { bride: 'Huhu hút ngược!', groom: 'Debuff nặng quá!' },
  ],
  bad_beer: [
    { bride: 'Say xỉn rồi!', groom: 'Trái phải đảo!' },
    { bride: 'Huhu chóng mặt!', groom: 'Bia độc quá!' },
  ],
};

const EN_BAD_ITEMS: ItemBank = {
  banana: [
    { bride: 'Banana slip!', groom: 'Who dropped that?!' },
    { bride: 'Almost fell!', groom: 'Sneaky peel!' },
    { bride: 'Wobbly feet!', groom: 'Too slow to dodge!' },
  ],
  torn_socks: [
    { bride: 'Torn socks?!', groom: 'Not mine, promise!' },
    { bride: 'So smelly!', groom: 'Toss it, {bride}!' },
    { bride: 'Ew holey socks!', groom: 'Mean gift!' },
  ],
  dried_fish: [
    { bride: 'Stinky dried fish!', groom: 'What is that smell?' },
    { bride: 'So fishy!', groom: "Don't sniff it!" },
    { bride: 'Weird fish?!', groom: 'Devil gift for sure!' },
  ],
  empty_box: [
    { bride: 'Empty box!', groom: 'We got pranked!' },
    { bride: 'Opened… nothing!', groom: 'So disappointing!' },
    { bride: 'Box of air?', groom: 'Epic troll!' },
  ],
  bomb: [
    { bride: 'Boom!!!', groom: 'It exploded!' },
    { bride: 'A bomb?!', groom: "Couldn't dodge!" },
    { bride: 'Hair on fire!', groom: 'Sorry love!' },
  ],
  chili: [
    { bride: 'Tongue on fire!', groom: 'Evil chili!' },
    { bride: 'Face all red!', groom: 'Water, quick!' },
    { bride: 'So spicy!', groom: 'Who threw chili?!' },
  ],
  insult: [
    { bride: 'Mean words?!', groom: "Don't listen!" },
    { bride: 'That stung!', groom: "I've got you!" },
    { bride: 'Feeling sad…', groom: '{guest} is joking!' },
  ],
  torn_underwear: [
    { bride: 'What is THAT?!', groom: "Don't look!" },
    { bride: 'So embarrassing!', groom: 'Throw it far!' },
    { bride: 'Mortified!', groom: 'Who is this mean?!' },
  ],
  stock_crash: [
    { bride: 'Stocks crashing!', groom: 'Portfolio crying!' },
    { bride: 'Money gone!', groom: 'Even holding loses!' },
    { bride: 'Wallet burned!', groom: 'No more FOMO!' },
  ],
  dead_mouse: [
    { bride: 'A dead mouse?!', groom: 'Nightmare fuel!' },
    { bride: 'Mice scare me!', groom: "I'll clear it!" },
    { bride: 'Ew ew ew!', groom: 'Who trolled us?' },
  ],
  tomato: [
    { bride: 'Tomato to the face!', groom: 'Tomato festival?!' },
    { bride: 'Dress stained!', groom: "I'll wash it!" },
    { bride: 'All messy!', groom: 'Bad aim!' },
  ],
  brick: [
    { bride: 'Brick to the head!', groom: 'Way too heavy!' },
    { bride: 'Back hurts!', groom: 'Building a house?!' },
    { bride: 'Gonna bruise!', groom: 'Dodged too late!' },
  ],
  expired_medicine: [
    { bride: 'Expired meds!', groom: "Don't take them!" },
    { bride: 'Scary pills!', groom: 'Bin them now!' },
    { bride: 'Poison pills?', groom: 'So cruel!' },
  ],
  instant_noodles: [
    { bride: 'Wedding ramen?', groom: 'Are we that broke?!' },
    { bride: 'Instant noodles!', groom: 'Steak tomorrow!' },
    { bride: 'Odd gift!', groom: 'Must be a joke!' },
  ],
  empty_barrel: [
    { bride: 'Empty barrel!', groom: 'No fuel inside!' },
    { bride: 'Heavy but empty!', groom: 'Total scam!' },
    { bride: 'So tired!', groom: 'Drop it, love!' },
  ],
  empty_wallet: [
    { bride: 'Wallet: 0 đồng!', groom: "I'm broke too!" },
    { bride: 'No money left!', groom: 'Love is enough!' },
    { bride: 'Flat wallet!', groom: 'Next month…' },
  ],
  broken_phone: [
    { bride: 'Cracked phone!', groom: 'Spiderweb screen!' },
    { bride: 'Phone is dead!', groom: 'Where’s insurance?' },
    { bride: "Can't call!", groom: 'Already smashed!' },
  ],
  snake: [
    { bride: 'Snake!!!', groom: 'Stay still!' },
    { bride: 'I hate snakes!', groom: "I'll chase it!" },
    { bride: 'In our basket?!', groom: 'What monster?!' },
  ],
  rotten_egg: [
    { bride: 'Rotten egg!!!', groom: 'Smell of doom!' },
    { bride: 'Gonna puke!', groom: 'Pinch your nose!' },
    { bride: 'Reeks forever!', groom: 'Who threw eggs?' },
  ],
  stress: [
    { bride: 'Stress attack!', groom: 'Breathe, {bride}!' },
    { bride: 'Too much pressure!', groom: 'Hug incoming!' },
    { bride: 'Head exploding!', groom: 'Slow down a bit!' },
  ],
  bad_magnet: [
    { bride: 'Evil magnet!', groom: 'Goods get pushed!' },
    { bride: 'Sucking wrong way!', groom: 'Heavy debuff!' },
  ],
  bad_beer: [
    { bride: "We're drunk!", groom: 'Controls flipped!' },
    { bride: 'So dizzy!', groom: 'Nasty beer!' },
  ],
};

const ZH_BAD_ITEMS: ItemBank = {
  banana: [
    { bride: '香蕉皮滑倒！', groom: '谁扔的啊？' },
    { bride: '差点摔倒！', groom: '皮太阴了！' },
    { bride: '脚软了！', groom: '躲慢了！' },
  ],
  torn_socks: [
    { bride: '破袜子？！', groom: '不是我的！' },
    { bride: '好臭！', groom: '快扔掉！' },
    { bride: 'Ew破洞袜！', groom: '礼物好狠！' },
  ],
  dried_fish: [
    { bride: '臭干鱼！', groom: '什么味道？' },
    { bride: '好腥！', groom: '别闻！' },
    { bride: '怪鱼？！', groom: '恶魔送的！' },
  ],
  empty_box: [
    { bride: '空盒子！', groom: '被骗了！' },
    { bride: '打开…什么都没有！', groom: '好失望！' },
    { bride: '空气礼盒？', groom: '整蛊高手！' },
  ],
  bomb: [
    { bride: 'Boom！！！', groom: '炸了！' },
    { bride: '炸弹？！', groom: '躲不及！' },
    { bride: '头发着火！', groom: '对不起！' },
  ],
  chili: [
    { bride: '辣到舌头！', groom: '辣椒太狠！' },
    { bride: '脸全红了！', groom: '快喝水！' },
    { bride: '好辣！', groom: '谁扔辣椒？' },
  ],
  insult: [
    { bride: '骂人？！', groom: '别听！' },
    { bride: '好扎心！', groom: '我在这儿！' },
    { bride: '好难过…', groom: '{guest}在开玩笑！' },
  ],
  torn_underwear: [
    { bride: '那是什么？！', groom: '别看！' },
    { bride: '好丢脸！', groom: '扔远点！' },
    { bride: '羞死了！', groom: '谁这么坏？' },
  ],
  stock_crash: [
    { bride: '股市崩了！', groom: '账户在哭！' },
    { bride: '钱没了！', groom: '拿住也亏！' },
    { bride: '钱包烧了！', groom: '别再FOMO！' },
  ],
  dead_mouse: [
    { bride: '死老鼠？！', groom: '太吓人！' },
    { bride: '我怕老鼠！', groom: '我来清！' },
    { bride: 'Ew ew ew！', groom: '谁整蛊？' },
  ],
  tomato: [
    { bride: '番茄砸脸！', groom: '番茄大战？' },
    { bride: '裙子脏了！', groom: '我帮你洗！' },
    { bride: '全弄脏了！', groom: '扔歪了！' },
  ],
  brick: [
    { bride: '砖头砸头！', groom: '太重了！' },
    { bride: '背疼！', groom: '盖房子吗？' },
    { bride: '要瘀青了！', groom: '躲晚了！' },
  ],
  expired_medicine: [
    { bride: '过期药！', groom: '别吃！' },
    { bride: '好可怕！', groom: '马上扔掉！' },
    { bride: '毒药？', groom: '太坏了！' },
  ],
  instant_noodles: [
    { bride: '婚礼泡面？', groom: '我们很穷吗？' },
    { bride: '方便面！', groom: '明天吃牛排！' },
    { bride: '怪礼物！', groom: '肯定是玩笑！' },
  ],
  empty_barrel: [
    { bride: '空桶！', groom: '没有油！' },
    { bride: '又重又空！', groom: '彻底被骗！' },
    { bride: '好累！', groom: '放下吧！' },
  ],
  empty_wallet: [
    { bride: '钱包没钱！', groom: '我也破产！' },
    { bride: '没钱了！', groom: '有爱就够！' },
    { bride: '扁平钱包！', groom: '下个月再说！' },
  ],
  broken_phone: [
    { bride: '手机裂了！', groom: '蜘蛛网屏幕！' },
    { bride: '手机坏了！', groom: '保险呢？' },
    { bride: '打不了电话！', groom: '已经碎了！' },
  ],
  snake: [
    { bride: '蛇！！！', groom: '别动！' },
    { bride: '我怕蛇！', groom: '我来赶！' },
    { bride: '爬进篮子？！', groom: '什么怪物？' },
  ],
  rotten_egg: [
    { bride: '臭鸡蛋！！！', groom: '毁灭气味！' },
    { bride: '要吐了！', groom: '捏住鼻子！' },
    { bride: '臭翻天！', groom: '谁扔蛋？' },
  ],
  stress: [
    { bride: '压力来了！', groom: '深呼吸，{bride}！' },
    { bride: '压力好大！', groom: '抱一下！' },
    { bride: '头要炸！', groom: '慢一点！' },
  ],
  bad_magnet: [
    { bride: '坏磁铁！', groom: '好物被推开！' },
    { bride: '吸反了！', groom: '重减益！' },
  ],
  bad_beer: [
    { bride: '喝醉了！', groom: '操作反了！' },
    { bride: '好晕！', groom: '啤酒太毒！' },
  ],
};

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
    { bride: 'Xui quá đi!', groom: 'Vận đen tạm thôi!' },
    { bride: 'Quà độc quá!', groom: 'Né tiếp nào!' },
    { bride: 'Rổ bị nhiễm!', groom: 'Làm sạch liền!' },
    { bride: 'Huhu điểm khóc!', groom: 'Gỡ lại được mà!' },
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
  good: [
    { bride: 'Yay pretty gift!', groom: 'Thanks {guest}!' },
    { bride: 'My heart flies!', groom: '{bride} smiles so bright!' },
    { bride: 'Perfect catch!', groom: 'Top tier!' },
    { bride: 'So sweet!', groom: 'More please!' },
    { bride: '{groom}, score up!', groom: 'Nice catch, right?' },
    { bride: 'Combo time!', groom: "Won't drop it!" },
    { bride: 'So happy!', groom: 'Forever with you!' },
    { bride: 'Lucky money!', groom: 'Fridge is close!' },
    { bride: 'Pretty as a flower!', groom: "You're the best!" },
    { bride: 'Gift from {guest}!', groom: 'Best guest ever!' },
    { bride: 'Hehe got it!', groom: 'Perfect teamwork!' },
    { bride: 'Heart +1!', groom: 'More points!' },
    { bride: 'Sweet as honey!', groom: 'Sweet like {bride}!' },
    { bride: 'Basket filling!', groom: 'Keep it up!' },
    { bride: 'Dreams coming!', groom: 'We got this!' },
  ],
  bad: [
    { bride: 'Oh no, bad item!', groom: 'Sorry love!' },
    { bride: 'Oops... missed!', groom: "I'll dodge better!" },
    { bride: 'Please stop!', groom: 'That devil is mean!' },
    { bride: 'We lost a life!', groom: 'Careful, love!' },
    { bride: 'Oh {groom}!', groom: "I'm here, calm down!" },
    { bride: 'Combo broken!', groom: "Let's reset!" },
    { bride: 'So gross!', groom: 'Stay away!' },
    { bride: 'So scary!', groom: "I've got you!" },
    { bride: 'No more greed!', groom: "You're right!" },
    { bride: 'Oh my lives!', groom: 'Still salvageable!' },
    { bride: 'So unlucky!', groom: 'Bad luck is temporary!' },
    { bride: 'Toxic gift!', groom: 'Keep dodging!' },
    { bride: 'Basket contaminated!', groom: 'Clean it up!' },
    { bride: 'Score is crying!', groom: 'We can recover!' },
  ],
  bonus: [
    { bride: 'Heaven bonus!', groom: 'Lucky {bride}!' },
    { bride: 'Magnet time!', groom: 'Suck gifts in!' },
    { bride: 'Bright shield!', groom: 'Temp invincible!' },
    { bride: 'x2 score!', groom: 'Feast time!' },
    { bride: 'Cute angel!', groom: 'Thanks, angel!' },
    { bride: 'Blessings incoming!', groom: 'Fortune at home!' },
    { bride: 'So sparkly!', groom: 'Keep the rhythm!' },
    { bride: 'Luck arrives!', groom: "Don't miss it!" },
  ],
  specialBad: [
    { bride: 'We turned all red!', groom: 'Heavy debuff!' },
    { bride: 'Bad magnet!', groom: 'Goods pushed away!' },
    { bride: "We're drunk!", groom: 'Controls reversed!' },
    { bride: 'Nasty debuff!', groom: 'Hang in there {bride}!' },
    { bride: 'Bad status wins!', groom: 'Good bonus gone!' },
    { bride: 'So dizzy!', groom: 'Left-right flipped!' },
  ],
};

const ZH: MoodBank = {
  good: [
    { bride: '耶，礼物真美！', groom: '谢谢 {guest}！' },
    { bride: '心飞起来了！', groom: '{bride} 笑得好甜！' },
    { bride: '接得漂亮！', groom: '太强了！' },
    { bride: '好甜呀！', groom: '再来！' },
    { bride: '{groom}，分数涨！', groom: '我接得帅吗？' },
    { bride: '连击加油！', groom: '绝不漏接！' },
    { bride: '好幸福！', groom: '永远陪你！' },
    { bride: '红包来了！', groom: '冰箱不远了！' },
    { bride: '美得像花！', groom: '你最棒！' },
    { bride: '礼物来自 {guest}！', groom: '嘉宾给力！' },
    { bride: '嘿嘿接到了！', groom: '配合满分！' },
    { bride: '爱心+1！', groom: '再加分！' },
    { bride: '甜如蜜！', groom: '甜得像 {bride}！' },
    { bride: '篮子快满了！', groom: '就这样！' },
    { bride: '梦想来了！', groom: '我们行的！' },
  ],
  bad: [
    { bride: '呜呜坏东西！', groom: '对不起！' },
    { bride: '哎呀…漏了！', groom: '我会躲更好！' },
    { bride: '别再来了！', groom: '恶魔好凶！' },
    { bride: '掉血了！', groom: '小心点！' },
    { bride: '呜呜 {groom}！', groom: '我在，别慌！' },
    { bride: '连击断了！', groom: '再来！' },
    { bride: '好臭！', groom: '离远点！' },
    { bride: '好怕！', groom: '我护着你！' },
    { bride: '别贪了！', groom: '你说得对！' },
    { bride: '呜呜命啊！', groom: '还能救！' },
    { bride: '好倒霉！', groom: '霉运会过去！' },
    { bride: '礼物有毒！', groom: '继续躲！' },
    { bride: '篮子被污染！', groom: '马上清！' },
    { bride: '分数在哭！', groom: '还能翻盘！' },
  ],
  bonus: [
    { bride: '天上奖励！', groom: '太幸运了 {bride}！' },
    { bride: '磁铁来了！', groom: '吸礼物！' },
    { bride: '闪亮护盾！', groom: '暂时无敌！' },
    { bride: '双倍分数！', groom: '大吃特吃！' },
    { bride: '天使好可爱！', groom: '谢谢天使！' },
    { bride: '祝福降临！', groom: '好运满屋！' },
    { bride: '好闪亮！', groom: '稳住节奏！' },
    { bride: '好运来了！', groom: '别错过！' },
  ],
  specialBad: [
    { bride: '全身变红了！', groom: '重减益！' },
    { bride: '坏磁铁！', groom: '好物被推开！' },
    { bride: '喝醉了！', groom: '操作反了！' },
    { bride: '负面状态！', groom: '撑住 {bride}！' },
    { bride: '坏状态优先！', groom: '好奖励没了！' },
    { bride: '好晕！', groom: '左右颠倒！' },
  ],
};

const BANKS: Record<Locale, MoodBank> = { vi: VI, en: EN, zh: ZH };

const BAD_ITEM_BANKS: Record<Locale, ItemBank> = {
  vi: VI_BAD_ITEMS,
  en: EN_BAD_ITEMS,
  zh: ZH_BAD_ITEMS,
};

function pickFrom(
  pool: readonly CoupleLinePair[],
): CoupleLinePair {
  const picked = pool[Math.floor(Math.random() * pool.length)] ?? pool[0]!;
  return {
    bride: fill(picked.bride),
    groom: fill(picked.groom),
  };
}

export function pickCoupleLines(
  locale: Locale,
  mood: CoupleMood,
  itemId?: string,
): CoupleLinePair {
  if (mood === 'bad' && itemId !== undefined) {
    const itemPool = BAD_ITEM_BANKS[locale][itemId];
    if (itemPool !== undefined && itemPool.length > 0) {
      return pickFrom(itemPool);
    }
  }

  if (mood === 'specialBad' && itemId !== undefined) {
    const itemPool = BAD_ITEM_BANKS[locale][itemId];
    if (itemPool !== undefined && itemPool.length > 0) {
      return pickFrom(itemPool);
    }
  }

  return pickFrom(BANKS[locale][mood]);
}
