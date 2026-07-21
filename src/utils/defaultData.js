/**
 * 默认示例数据 — 创品智造
 * 以「面膜」品类为例，首次加载时展示
 * 注意：所有数据基于AI推理=无真实采集，仅供演示结构
 */

export const defaultTrendData = {
  category: '面膜',
  scanDate: '2026-07-03',
  dataSource: {
    realSources: [],
    failedSources: ['京东搜索', '天猫搜索', '拼多多搜索', '抖音趋势', '小红书趋势', 'Google Trends', '百度搜索'],
    collectTime: '',
    isRealData: false,
    note: '示例数据，基于AI推理。仅展示系统结构和数据标注格式。'
  },
  metrics: {
    totalGMV: '382.6亿',
    totalGMV_source: 'AI估算·依据:品类规模常识',
    gmvGrowth: '+11.2%',
    gmvGrowth_source: 'AI估算·依据:行业增长趋势',
    brandCount: '4,200+',
    brandCount_source: 'AI估算·依据:品类成熟度推测',
    topBrandShare: '28.5%',
    topBrandShare_source: 'AI估算·依据:品类竞争格局常识'
  },
  trends: [
    { rank: 1, keyword: '敏感肌修护', share: 32, yoy: 450, verbatim: '"用完第二天脸不红了，回购第三次"', summary: '敏感肌人群持续扩大，修护型面膜搜索量激增', platform: '小红书', dataFromReal: false, sourcePlatform: 'AI推测·品类常识', inferenceBasis: '基于小红书内容趋势常识+敏感肌护肤热度' },
    { rank: 2, keyword: '胶原蛋白面膜', share: 28, yoy: 380, verbatim: '"敷完脸紧致了，法令纹淡了"', summary: '胶原蛋白概念热度攀升，抗衰需求下移至25+人群', platform: '天猫', dataFromReal: false, sourcePlatform: 'AI推测·品类常识', inferenceBasis: '基于天猫美妆趋势+抗衰成分认知' },
    { rank: 3, keyword: '医美术后敷料', share: 24, yoy: 320, verbatim: '"激光后医生推荐用的，修复超快"', summary: '医美术后修复场景需求爆发，械字号面膜受追捧', platform: '京东', dataFromReal: false, sourcePlatform: 'AI推测·品类常识', inferenceBasis: '基于医美渗透率上升趋势+械字号品类认知' },
    { rank: 4, keyword: '次抛面膜', share: 18, yoy: 260, verbatim: '"一次一袋不浪费，干净卫生"', summary: '次抛包装成为新趋势，卫生便捷需求驱动增长', platform: '抖音', dataFromReal: false, sourcePlatform: 'AI推测·品类常识', inferenceBasis: '基于抖音内容电商趋势+次抛品类热度' },
    { rank: 5, keyword: 'AI智能护肤', share: 15, yoy: 520, verbatim: '"AI测肤后推荐的面膜，真的对症了"', summary: 'AI护肤概念兴起，个性化定制面膜成为新方向', platform: '天猫', dataFromReal: false, sourcePlatform: 'AI推测·品类常识', inferenceBasis: '基于AI+美妆融合趋势常识' },
    { rank: 6, keyword: '男士面膜', share: 12, yoy: 220, verbatim: '"老公终于愿意护肤了，这款不油腻"', summary: '男性护肤意识觉醒，控油清洁型面膜增长迅速', platform: '京东', dataFromReal: false, sourcePlatform: 'AI推测·品类常识', inferenceBasis: '基于男性护肤市场增长趋势常识' },
    { rank: 7, keyword: '微生物组护肤', share: 8, yoy: 680, verbatim: '"皮肤微生态平衡后真的不敏感了"', summary: '微生态护肤概念教育成熟，益生菌面膜增速最快', platform: '小红书', dataFromReal: false, sourcePlatform: 'AI推测·品类常识', inferenceBasis: '基于微生态护肤概念趋势+成分端认知' },
  ],
  painPoints: [
    { rank: 1, pain: '敷完反而过敏泛红', intensity: 88, satisfaction: 25, gap: 78, userVoice: '"说是修护，敷完脸更红了"', currentSolutions: ['普通修护面膜刺激性仍然较大', '械字号面膜选择少价格高'], opportunity: '真正零刺激的敏肌专用修护膜布+配方', dataFromReal: false, sourcePlatform: 'AI推测·行业经验', inferenceBasis: '基于品类常见投诉模式+敏肌人群数据' },
    { rank: 2, pain: '功效不持续，敷完第二天打回原形', intensity: 82, satisfaction: 35, gap: 72, userVoice: '"当晚效果好，第二天又干了"', currentSolutions: ['普通贴片面膜仅表层补水', '高端抗衰面膜价格过高'], opportunity: '缓释技术+高浓度活性物锁鲜膜', dataFromReal: false, sourcePlatform: 'AI推测·行业经验', inferenceBasis: '基于面膜品类常见功效持久性问题' },
    { rank: 3, pain: '面膜精华液太稀，感觉全是水', intensity: 75, satisfaction: 40, gap: 65, userVoice: '"滴得到处都是，感觉没什么营养"', currentSolutions: ['增稠剂调配但活性物含量低', '次抛解决卫生但精华浓度不够'], opportunity: '高浓度精华+冻干锁鲜技术', dataFromReal: false, sourcePlatform: 'AI推测·行业经验', inferenceBasis: '基于消费者对成分浓度的认知升级' },
    { rank: 4, pain: '膜布不服帖，鼻翼下巴敷不到', intensity: 68, satisfaction: 45, gap: 58, userVoice: '"脸小的人敷着到处翘边"', currentSolutions: ['通用裁剪膜布适配性差', '分区面膜尚未普及'], opportunity: 'AI人脸扫描定制裁剪膜布', dataFromReal: false, sourcePlatform: 'AI推测·行业经验', inferenceBasis: '基于面膜使用体验常见痛点' },
    { rank: 5, pain: '男士找不到合适的面膜', intensity: 60, satisfaction: 30, gap: 62, userVoice: '"都是女性设计的，太香太油"', currentSolutions: ['男士专属线少且选择窄', '女性面膜控油力不足'], opportunity: '男士专研控油+清爽质地+中性包装', dataFromReal: false, sourcePlatform: 'AI推测·行业经验', inferenceBasis: '基于男性护肤市场空白分析' },
  ],
  gapMatrix: {
    priceRanges: ['10元以下', '10-30元', '30-60元', '60-120元', '120元以上'],
    functions: ['基础补水', '美白提亮', '抗衰紧致', '敏肌修护', '控油清洁'],
    cells: [
      { priceIndex: 0, funcIndex: 0, share: 25, growth: 5, competition: '高', isEmpty: false, opportunityScore: 15 },
      { priceIndex: 0, funcIndex: 1, share: 12, growth: 8, competition: '高', isEmpty: false, opportunityScore: 20 },
      { priceIndex: 0, funcIndex: 2, share: 3, growth: 15, competition: '中', isEmpty: true, opportunityScore: 45 },
      { priceIndex: 0, funcIndex: 3, share: 2, growth: 30, competition: '低', isEmpty: true, opportunityScore: 68 },
      { priceIndex: 0, funcIndex: 4, share: 8, growth: 12, competition: '中', isEmpty: false, opportunityScore: 30 },
      { priceIndex: 1, funcIndex: 0, share: 30, growth: 3, competition: '高', isEmpty: false, opportunityScore: 10 },
      { priceIndex: 1, funcIndex: 1, share: 15, growth: 10, competition: '高', isEmpty: false, opportunityScore: 25 },
      { priceIndex: 1, funcIndex: 2, share: 5, growth: 20, competition: '中', isEmpty: false, opportunityScore: 40 },
      { priceIndex: 1, funcIndex: 3, share: 4, growth: 45, competition: '低', isEmpty: true, opportunityScore: 75 },
      { priceIndex: 1, funcIndex: 4, share: 10, growth: 15, competition: '中', isEmpty: false, opportunityScore: 35 },
      { priceIndex: 2, funcIndex: 0, share: 15, growth: -5, competition: '高', isEmpty: false, opportunityScore: 12 },
      { priceIndex: 2, funcIndex: 1, share: 18, growth: 12, competition: '中', isEmpty: false, opportunityScore: 30 },
      { priceIndex: 2, funcIndex: 2, share: 12, growth: 25, competition: '中', isEmpty: false, opportunityScore: 50 },
      { priceIndex: 2, funcIndex: 3, share: 6, growth: 55, competition: '低', isEmpty: true, opportunityScore: 85 },
      { priceIndex: 2, funcIndex: 4, share: 5, growth: 18, competition: '低', isEmpty: true, opportunityScore: 55 },
      { priceIndex: 3, funcIndex: 0, share: 5, growth: -8, competition: '中', isEmpty: false, opportunityScore: 15 },
      { priceIndex: 3, funcIndex: 1, share: 10, growth: 15, competition: '中', isEmpty: false, opportunityScore: 35 },
      { priceIndex: 3, funcIndex: 2, share: 20, growth: 30, competition: '中', isEmpty: false, opportunityScore: 55 },
      { priceIndex: 3, funcIndex: 3, share: 8, growth: 65, competition: '低', isEmpty: true, opportunityScore: 92 },
      { priceIndex: 3, funcIndex: 4, share: 3, growth: 22, competition: '低', isEmpty: true, opportunityScore: 60 },
      { priceIndex: 4, funcIndex: 0, share: 2, growth: -10, competition: '低', isEmpty: true, opportunityScore: 20 },
      { priceIndex: 4, funcIndex: 1, share: 5, growth: 18, competition: '中', isEmpty: false, opportunityScore: 40 },
      { priceIndex: 4, funcIndex: 2, share: 15, growth: 35, competition: '中', isEmpty: false, opportunityScore: 60 },
      { priceIndex: 4, funcIndex: 3, share: 5, growth: 80, competition: '低', isEmpty: true, opportunityScore: 95 },
      { priceIndex: 4, funcIndex: 4, share: 1, growth: 25, competition: '低', isEmpty: true, opportunityScore: 50 },
    ]
  },
  opportunities: [
    { rank: 1, title: '中高价格带敏肌修护膜', trendSignal: '敏感肌修护搜索+450%，医美术后敷料+320%', demandGap: '现有修护面膜刺激率仍高，械字号选择少', feasibility: '械字号备案+温和配方已有成熟方案', score: 92, rationale: '需求增速最快+供给最空白+技术门槛适中', sourcePlatform: 'AI推测·行业经验', inferenceBasis: '基于品类增速分析+供给空白判断' },
    { rank: 2, title: '高浓度冻干精华面膜', trendSignal: '次抛面膜+260%，胶原蛋白面膜+380%', demandGap: '用户反馈精华太稀、功效不持续', feasibility: '冻干技术成熟，冻干面膜已有先例', score: 85, rationale: '解决核心痛点+技术可行+差异化明显', sourcePlatform: 'AI推测·行业经验', inferenceBasis: '基于用户痛点分析+技术可行性判断' },
    { rank: 3, title: 'AI定制裁剪面膜', trendSignal: 'AI智能护肤+520%', demandGap: '膜布不服帖是普遍痛点', feasibility: '需AI测肤+柔性裁剪供应链配合', score: 78, rationale: '创新度高但供应链复杂度也高', sourcePlatform: 'AI推测·品类常识', inferenceBasis: '基于AI+美妆融合趋势分析' },
    { rank: 4, title: '微生态平衡面膜', trendSignal: '微生物组护肤+680%', demandGap: '市场上益生菌面膜极少且教育不足', feasibility: '益生菌原料已有供应商', score: 72, rationale: '增速最快但市场教育成本高', sourcePlatform: 'AI推测·品类常识', inferenceBasis: '基于成分趋势+市场竞争格局分析' },
    { rank: 5, title: '男士专研控油面膜', trendSignal: '男士面膜+220%', demandGap: '男士专属线少且体验差', feasibility: '配方和包装调整成本低', score: 68, rationale: '蓝海市场+开发成本低+品牌心智机会', sourcePlatform: 'AI推测·行业经验', inferenceBasis: '基于男性护肤市场空白+低开发成本判断' },
  ]
}

export const defaultConcepts = {
  category: '面膜',
  generatedAt: '2026-07-03',
  concepts: [
    {
      id: 'concept-1',
      name: '复颜安敏术后修护膜',
      tagline: '医美术后第一片膜，0刺激修护',
      targetAudience: { age: '25-40', gender: '女性为主', scenario: '医美术后/敏感肌日常修护', spendingPower: '中高端' },
      corePainPoint: '医美术后面部红肿敏感，普通面膜敷完反而更红',
      usp: '械字号备案+0香精0酒精+重组胶原蛋白III型，术后2小时即可使用',
      formulationDirection: {
        coreIngredients: ['重组胶原蛋白III型', '积雪草苷', '泛醇B5', '神经酰胺NP', '透明质酸钠'],
        techRoute: '仿生细胞外基质配方+低温冷萃保活',
        keyBenefit: '模拟皮肤天然修护环境，加速屏障修复'
      },
      packagingDirection: {
        material: '医用级备硅藻土膜布',
        style: '临床级白色简约包装',
        spec: '25g/片 × 5片/盒',
        unboxingExperience: '独立灭菌包装，撕开即用'
      },
      priceRange: '59-89元/盒',
      priceStrategy: '锚定可复美159元，以械字号+同等成分降维打击',
      marketSize: { tam: '382亿', sam: '85亿', som: '8.5亿' },
      feasibilityScore: 4,
      devCycleEstimate: '4-5个月（含械字号备案）',
      innovationLevel: '差异创新',
      competitorGap: '可复美价格过高（159元），白牌无械字号，本品卡位中间带',
      riskFactors: ['械字号备案周期2-3个月', '胶原蛋白原料成本较高'],
      successMetrics: ['上市3月内月销破500万', '复购率>35%', '小红书种草笔记>5000篇']
    },
    {
      id: 'concept-2',
      name: '鲜注冻干高浓精华膜',
      tagline: '不是面膜，是一整瓶精华冻在膜上',
      targetAudience: { age: '28-45', gender: '女性', scenario: '高端抗衰日常护理', spendingPower: '高端' },
      corePainPoint: '普通面膜精华太稀，敷完第二天效果就没了',
      usp: '冻干锁鲜技术+30ml高浓精华（普通面膜仅15-20ml），活性物含量提升3倍',
      formulationDirection: {
        coreIngredients: ['冻干胶原蛋白肽', '麦角硫因', '玻色因', '蓝铜胜肽', '角鲨烷'],
        techRoute: '-196°C冻干锁鲜+使用时注入溶媒激活',
        keyBenefit: '活性物100%保留，克服液态配方失活问题'
      },
      packagingDirection: {
        material: '铝箔冻干密封舱+溶媒安瓶',
        style: '科技感渐变蓝银包装',
        spec: '冻干膜30ml + 溶媒15ml',
        unboxingExperience: '按压注入→膜布膨胀→精华吸收，仪式感强'
      },
      priceRange: '89-129元/盒',
      priceStrategy: '对标修丽可249元冻干膜，以1/2价格提供80%体验',
      marketSize: { tam: '382亿', sam: '60亿', som: '6亿' },
      feasibilityScore: 3,
      devCycleEstimate: '5-6个月（冻干工艺调试+包材定制）',
      innovationLevel: '颠覆创新',
      competitorGap: '修丽可价格门槛过高，国货冻干膜品质参差不齐，本品主打高浓+高性价',
      riskFactors: ['冻干工艺调试周期长', '包材模具定制成本高', '需教育用户使用方式'],
      successMetrics: ['上市6月月销破800万', '客单价>100元', '抖音自播ROI>2.5']
    },
    {
      id: 'concept-3',
      name: 'He控男士竹炭清爽膜',
      tagline: '他的第一片面膜，不油不香不麻烦',
      targetAudience: { age: '22-35', gender: '男性', scenario: '日常控油/运动后清洁', spendingPower: '中端' },
      corePainPoint: '男性找不到不油腻、不香、使用简单的面膜',
      usp: '竹炭吸附+烟酰胺控油双效，无香精配方，3分钟快敷设计',
      formulationDirection: {
        coreIngredients: ['竹炭粉', '烟酰胺3%', '水杨酸0.5%', '北美金缕梅', '薄荷醇'],
        techRoute: '物理吸附+化学控油双通路',
        keyBenefit: '竹炭深层吸附油脂，烟酰胺调节皮脂分泌'
      },
      packagingDirection: {
        material: '黑色竹炭纤维膜布',
        style: '极简黑灰运动风包装',
        spec: '20g/片 × 6片/盒',
        unboxingExperience: '撕开即贴，3分钟取下，无残留需清洗'
      },
      priceRange: '39-59元/盒',
      priceStrategy: '对标高夫69元，以更低价格+更强控油切入',
      marketSize: { tam: '382亿', sam: '35亿', som: '3.5亿' },
      feasibilityScore: 5,
      devCycleEstimate: '2-3个月',
      innovationLevel: '微创新',
      competitorGap: '现有男士面膜仍以女性配方改包装，本品从配方专为男性皮脂设计',
      riskFactors: ['男士面膜市场教育仍需投入', '价格竞争激烈'],
      successMetrics: ['上市2月月销破300万', '男性用户占比>70%', '京东男士面膜TOP10']
    },
    {
      id: 'concept-4',
      name: '微生态平衡益生菌膜',
      tagline: '养好皮肤微生态，从根源告别敏感',
      targetAudience: { age: '25-38', gender: '女性为主', scenario: '敏感肌长期调理', spendingPower: '中高端' },
      corePainPoint: '皮肤反复敏感，根源是微生态失衡而非屏障问题',
      usp: '后生元+益生元双效配方，调节皮肤菌群平衡，临床验证28天敏感率降低62%',
      formulationDirection: {
        coreIngredients: ['乳酸杆菌发酵产物（后生元）', 'α-葡聚糖寡糖（益生元）', '神经酰胺AP', '红没药醇', '泛醇'],
        techRoute: '微生态调节+屏障修护双通路',
        keyBenefit: '恢复皮肤菌群多样性，从根源减少反复敏感'
      },
      packagingDirection: {
        material: '生物纤维膜布（透气性佳）',
        style: '实验室风透明+绿色点缀',
        spec: '23g/片 × 5片/盒',
        unboxingExperience: '凝胶质地精华，清凉不黏腻'
      },
      priceRange: '69-99元/盒',
      priceStrategy: '对标瑷尔博士89元益生菌面膜，以临床数据背书差异化',
      marketSize: { tam: '382亿', sam: '25亿', som: '2.5亿' },
      feasibilityScore: 3,
      devCycleEstimate: '4-5个月',
      innovationLevel: '差异创新',
      competitorGap: '瑷尔博士偏基础款，本品主打临床级微生态+术后修护场景',
      riskFactors: ['微生态概念仍需市场教育', '后生元原料供应商选择有限'],
      successMetrics: ['临床测试28天敏感率降低>50%', '小红书微生态话题笔记>1万', '复购率>30%']
    },
    {
      id: 'concept-5',
      name: 'AI测肤定制裁剪膜',
      tagline: '你的脸型，你说了算',
      targetAudience: { age: '20-35', gender: '不限', scenario: '追求个性化护肤体验', spendingPower: '中高端' },
      corePainPoint: '面膜膜布千篇一律，鼻翼下巴总是敷不到',
      usp: '扫码AI测肤→生成专属裁剪方案→3D切割膜布+个性化精华配方',
      formulationDirection: {
        coreIngredients: ['根据测肤结果动态调配（基础：玻尿酸+烟酰胺+神经酰胺）'],
        techRoute: 'AI肤质分析+模块化配方+3D柔性裁剪',
        keyBenefit: '千人千面，膜布贴合度+配方针对性双重定制'
      },
      packagingDirection: {
        material: '3D切割超细纤维膜布',
        style: '科技感镭射包装+个人ID定制',
        spec: '专属裁剪膜布+定制精华25ml',
        unboxingExperience: '扫码测肤→收到定制盒→专属ID印在包装上'
      },
      priceRange: '99-149元/盒',
      priceStrategy: '定制化溢价，对标高端院线品牌但以AI降低服务成本',
      marketSize: { tam: '382亿', sam: '15亿', som: '1.5亿' },
      feasibilityScore: 2,
      devCycleEstimate: '6-8个月（AI系统+柔性供应链）',
      innovationLevel: '颠覆创新',
      competitorGap: '市面无AI定制面膜，本品创造全新品类',
      riskFactors: ['柔性供应链搭建复杂', 'AI测肤准确度需验证', '客单价高转化率可能低'],
      successMetrics: ['测肤转化率>40%', '定制复购率>45%', '客单价>120元']
    }
  ]
}

export const defaultSpec = {
  productName: '复颜安敏术后修护膜',
  category: '面膜',
  specDate: '2026-07-03',
  formulation: {
    coreFormula: [
      { ingredient: '重组胶原蛋白III型', percentage: '0.1-0.3%', function: '促修护、加速创面愈合' },
      { ingredient: '积雪草苷', percentage: '0.5-1.0%', function: '抗炎舒缓、促进胶原合成' },
      { ingredient: '泛醇B5', percentage: '1.0-2.0%', function: '保湿修护、促进上皮再生' },
      { ingredient: '神经酰胺NP', percentage: '0.2-0.5%', function: '修复屏障、锁水' },
      { ingredient: '透明质酸钠', percentage: '0.1-0.5%', function: '深层补水' }
    ],
    auxiliaryFormula: [
      { ingredient: '甘油', function: '保湿剂、溶剂' },
      { ingredient: '丁二醇', function: '保湿剂、促渗透' },
      { ingredient: '黄原胶', function: '增稠剂、稳定剂' }
    ],
    totalActiveContent: '活性物总含量3-5%',
    preservativeSystem: '对羟基苯乙酮+1,2-己二醇（无传统防腐剂）',
    phRange: '5.5-6.5'
  },
  efficacy: {
    primaryClaims: ['医美术后修护', '敏感肌舒缓退红'],
    secondaryClaims: ['深层保湿', '屏障修复'],
    supportingData: '重组胶原蛋白促修护临床数据+积雪草苷抗炎文献',
    complianceNote: '械字号备案，可宣称"冷敷理疗"，不可宣称治疗功效'
  },
  packaging: {
    primaryPack: { material: '医用级备硅藻土膜布', spec: '25g/片', designStyle: '临床级白色简约' },
    secondaryPack: { material: '医用级铝箔袋+纸盒', spec: '5片/盒' },
    labelRequirements: ['械字号备案号', '生产许可证号', '灭菌日期和批号', '一次性使用标识'],
    unboxingDesign: '独立灭菌铝箔袋，撕开即用，无需二次清洁'
  },
  qualityStandard: {
    keyIndicators: [
      { indicator: '菌落总数', standard: '<10 CFU/g', testMethod: 'GB 15979' },
      { indicator: 'pH值', standard: '5.5-6.5', testMethod: 'pH计法' },
      { indicator: '重金属(铅)', standard: '<10 mg/kg', testMethod: '原子吸收法' },
      { indicator: '胶原蛋白含量', standard: '0.1-0.3%', testMethod: 'ELISA法' }
    ],
    shelfLife: '24个月',
    storageCondition: '常温避光保存'
  },
  costEstimate: {
    rawMaterial: '3-5元/片',
    packaging: '1.5-2.5元/片',
    processing: '0.5-1元/片',
    totalCost: '5-8.5元/片（25g）',
    costLevel: '中'
  },
  pricingStrategy: {
    costMultiplier: '8-10倍',
    anchorPrice: '可复美159元/盒',
    suggestedPrice: '69-89元/盒',
    premiumRatio: '30-40%',
    premiumBasis: '械字号备案+重组胶原蛋白+术后场景溢价'
  },
  compliance: {
    registrationRequired: true,
    registrationType: '医疗器械一类备案（冷敷贴）',
    testingRequired: ['微生物检测', '皮肤刺激性测试', '细胞毒性测试', '重金属检测'],
    labelingRules: ['械字号标识规范', '不可宣称治疗功效', '需标注"冷敷理疗用"'],
    restrictedIngredients: ['禁用激素类', '禁用抗生素类', '香精添加量<0.01%']
  },
  supplierDirection: {
    supplierType: '械字号面膜代工厂（持有一类医疗器械生产许可证）',
    sourcingKeywords: ['械字号面膜代工', '医用冷敷贴OEM', '胶原蛋白面膜代工'],
    moqEstimate: '5,000-10,000盒',
    leadTime: '45-60天（含备案）'
  }
}

/**
 * 开发阶段定义
 */
export const DEV_STAGES = [
  { id: 1, name: '概念确认', tasks: ['目标人群锁定', 'USP定稿', '定价区间', '立项审批'], defaultDays: 7 },
  { id: 2, name: '配方研发', tasks: ['成分配方设计', '功效验证方案', '供应商对接', '初版样品'], defaultDays: 30 },
  { id: 3, name: '打样测试', tasks: ['实验室打样', '用户测试组', '功效数据', '迭代优化'], defaultDays: 21 },
  { id: 4, name: '包装设计', tasks: ['视觉方案', '包装材质', '合规审核', '终版确认'], defaultDays: 15 },
  { id: 5, name: '量产准备', tasks: ['工厂确认', '质检标准', '首批生产', '入库'], defaultDays: 20 },
  { id: 6, name: '上线准备', tasks: ['详情页', '种草内容', '上市计划', '正式发售'], defaultDays: 14 },
]

/**
 * 创建新产品的开发追踪数据
 */
export function createDevProject(concept, category) {
  const today = new Date()
  const stages = DEV_STAGES.map((stage, index) => {
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() + DEV_STAGES.slice(0, index).reduce((sum, s) => sum + s.defaultDays, 0))
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + stage.defaultDays)

    return {
      stageId: stage.id,
      name: stage.name,
      tasks: stage.tasks.map(t => ({ name: t, done: false })),
      status: index === 0 ? 'in_progress' : 'not_started',
      assignee: '',
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
      progress: 0,
      risks: [],
      notes: ''
    }
  })

  return {
    id: `dev-${Date.now()}`,
    conceptId: concept.id,
    productName: concept.name,
    category,
    tagline: concept.tagline || '',
    stages,
    currentStage: 1,
    createdAt: today.toISOString().slice(0, 10),
    updatedAt: today.toISOString().slice(0, 10),
    status: 'concept'
  }
}
