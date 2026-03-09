class DailyQuoteService {
  constructor() {
    this.quotes = [
      { text: '生活不是等待风暴过去，而是学会在雨中跳舞。', author: '维维安·格林' },
      { text: '成功的秘诀在于坚持不懈地追求目标。', author: '本杰明·富兰克林' },
      { text: '每一个不曾起舞的日子，都是对生命的辜负。', author: '尼采' },
      { text: '世界上只有一种真正的英雄主义，那就是在认清生活的真相后依然热爱生活。', author: '罗曼·罗兰' },
      { text: '人生就像骑单车，想保持平衡就得往前走。', author: '爱因斯坦' },
      { text: '最重要的事情不是你身在何处，而是你正朝着什么方向前进。', author: '奥利弗·温德尔·霍姆斯' },
      { text: '不要因为走得太远，而忘记当初为什么出发。', author: '纪伯伦' },
      { text: '生命中最重要的事情不是你遭遇了什么，而是你如何应对它。', author: '玛丽亚·罗宾逊' },
      { text: '昨天是历史，明天是谜团，而今天是礼物，这就是为什么它被称为"现在"。', author: '爱丽丝·莫尔斯·厄尔' },
      { text: '做你自己，因为别人都有人做了。', author: '奥斯卡·王尔德' },
      { text: '成功不是终点，失败也不是终结，唯有继续前进的勇气才是最重要的。', author: '温斯顿·丘吉尔' },
      { text: '你的时间有限，不要浪费时间活在别人的生活里。', author: '史蒂夫·乔布斯' },
      { text: '知识就是力量。', author: '弗朗西斯·培根' },
      { text: '学而不思则罔，思而不学则殆。', author: '孔子' },
      { text: '天行健，君子以自强不息。', author: '《周易》' },
      { text: '千里之行，始于足下。', author: '老子' },
      { text: '业精于勤，荒于嬉。', author: '韩愈' },
      { text: '不经一番寒彻骨，怎得梅花扑鼻香。', author: '黄蘖禅师' },
      { text: '路漫漫其修远兮，吾将上下而求索。', author: '屈原' },
      { text: '世上无难事，只怕有心人。', author: '中国谚语' }
    ];
  }

  getDailyQuote() {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
    const index = dayOfYear % this.quotes.length;
    return this.quotes[index];
  }

  getRandomQuote() {
    const index = Math.floor(Math.random() * this.quotes.length);
    return this.quotes[index];
  }
}

module.exports = new DailyQuoteService();