export interface CrystalStone {
  id: string;
  name: string;
  color: string; // Hex color
  icon: string; // Charm emoji/symbol
  tagline: string; // Poetic intent phrasing
  affirmations: string[]; // 2-3 ready affirmations
}

export const CRYSTALS: CrystalStone[] = [
  {
    id: 'ametist',
    name: 'Ametist',
    color: '#9B51E0',
    icon: '🔮',
    tagline: 'Ametist — Zihinsel berraklık ve iç huzur günü',
    affirmations: [
      'Zihnimi sakinleştiriyor, kendi ritmime güveniyorum.',
      'Düşüncelerim net ve berrak.',
      'Bugün içsel huzurumu koruyorum.',
    ],
  },
  {
    id: 'gul-kuvarsi',
    name: 'Gül Kuvarsı',
    color: '#EC4899',
    icon: '🌸',
    tagline: 'Gül kuvarsı — Kendine şefkat günü',
    affirmations: [
      'Bugün kendime nazik davranmayı seçiyorum.',
      'Kalbimi şefkatle ve sevgiyle açıyorum.',
      'Olduğum halimle yeterliyim.',
    ],
  },
  {
    id: 'sitrin',
    name: 'Sitrin',
    color: '#F59E0B',
    icon: '☀️',
    tagline: 'Sitrin — Neşe ve bolluk niyetleri',
    affirmations: [
      'Güneşin neşesini içimde hissediyorum.',
      'Küçük anlardaki bolluğu fark ediyorum.',
      'Bugün gülümsemek için nedenlerimi çoğaltıyorum.',
    ],
  },
  {
    id: 'ay-tasi',
    name: 'Ay Taşı',
    color: '#38BDF8',
    icon: '🌙',
    tagline: 'Ay taşı — Sezgi ve yenilik günü',
    affirmations: [
      'İçsel sezgilerime alan açıyorum.',
      'Değişimi zarafetle karşılıyorum.',
      'Duygularımın akışına izin veriyorum.',
    ],
  },
  {
    id: 'obsidyen',
    name: 'Obsidyen',
    color: '#475569',
    icon: '🛡️',
    tagline: 'Obsidyen — Kendi sınırlarını koruma günü',
    affirmations: [
      'Kendi alanımı sevgiyle koruyorum.',
      'Hayır demeyi bir özsaygı olarak görüyorum.',
      'Günü kendi merkezimde tamamlıyorum.',
    ],
  },
  {
    id: 'akuamarin',
    name: 'Akuamarin',
    color: '#06B6D4',
    icon: '🌊',
    tagline: 'Akuamarin — Ferahlık ve ifade günü',
    affirmations: [
      'Hissediklerimi özgürce ve sakince ifade ediyorum.',
      'Su gibi rahat ve esneğim.',
      'Zihnimi ferah bir nefesle tazeliyorum.',
    ],
  },
  {
    id: 'kaplan-gozu',
    name: 'Kaplan Gözü',
    color: '#D97706',
    icon: '👁️',
    tagline: 'Kaplan gözü — Cesaret ve odak günü',
    affirmations: [
      'Kararlarıma ve adımlarıma güveniyorum.',
      'Bugün hedefime odaklı kalıyorum.',
      'Zorlukları cesaretle karşılıyorum.',
    ],
  },
  {
    id: 'yesim',
    name: 'Yeşim',
    color: '#10B981',
    icon: '🌿',
    tagline: 'Yeşim — Denge ve yenilenme günü',
    affirmations: [
      'Doğanın dengesini hayatıma davet ediyorum.',
      'Tazeleniyor ve yenileniyorum.',
      'Her an yeni bir başlangıçtır.',
    ],
  },
];

export function getCrystalById(id?: string): CrystalStone | undefined {
  if (!id) return undefined;
  return CRYSTALS.find((c) => c.id === id);
}
