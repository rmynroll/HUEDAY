export interface ArtistPalette {
  id: string;
  artistName: string;
  themeName: string;
  colors: string[]; // 4 hex renk, DayCard.palette ile aynı format
  description: string;
}

export const ARTIST_PALETTES: ArtistPalette[] = [
  {
    id: 'toskana-gunbatimi',
    artistName: 'Elif Sancak',
    themeName: 'Toskana Günbatımı',
    colors: ['#E8734A', '#F2A65A', '#C94F5C', '#FCE2A8'],
    description: 'Sıcak, tozlu ve yavaşlayan bir akşam ışığı.',
  },
  {
    id: 'neo-tokyo-gece',
    artistName: 'Rin Kobayashi',
    themeName: 'Neo-Tokyo Gece',
    colors: ['#1B1035', '#FF2A6D', '#05D9E8', '#D1F7FF'],
    description: 'Neon ıslak asfalt ve şehrin elektrikli nabzı.',
  },
  {
    id: 'cam-goletler',
    artistName: 'Mira Aksoy',
    themeName: 'Cam Gölerler',
    colors: ['#0F4C5C', '#5FA8A0', '#A8DADC', '#F1FAEE'],
    description: 'Dağ havasında berrak, sakin ve derin bir nefes.',
  },
  {
    id: 'safran-pazari',
    artistName: 'Deniz Yıldırım',
    themeName: 'Safran Pazarı',
    colors: ['#D4A017', '#E85D3F', '#8C3B4A', '#F2E3C3'],
    description: 'Baharat kokulu sokaklar ve canlı bir kalabalık.',
  },
  {
    id: 'lavanta-alacakaranlik',
    artistName: 'Selin Ergün',
    themeName: 'Lavanta Alacakaranlığı',
    colors: ['#6B5B95', '#A084C4', '#D9C6E8', '#3B2E58'],
    description: 'Günün son ışığında yumuşak ve düşünceli bir sessizlik.',
  },
  {
    id: 'mercan-resif',
    artistName: 'Kaya Demirtaş',
    themeName: 'Mercan Resifi',
    colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C'],
    description: 'Su altında canlı, oyuncu ve enerjik bir renk cümbüşü.',
  },
  {
    id: 'kagit-ve-murekkep',
    artistName: 'Aylin Su',
    themeName: 'Kağıt ve Mürekkep',
    colors: ['#2B2B2B', '#5C5C5C', '#B8ACA0', '#F5F0E6'],
    description: 'Minimal, kâğıt dokulu ve sözü az bir gün.',
  },
  {
    id: 'cumak-ormanlari',
    artistName: 'Toprak Gür',
    themeName: 'Çamlı Orman',
    colors: ['#2D4A34', '#5C8A5C', '#9BB68C', '#DDE8D0'],
    description: 'Nemli toprak kokusu ve köklü bir dinginlik.',
  },
  {
    id: 'gece-yarisi-neonu',
    artistName: 'Ozan Vega',
    themeName: 'Gece Yarısı Neonu',
    colors: ['#0D0221', '#B537F2', '#F72585', '#4CC9F0'],
    description: 'Uykusuz şehirlerin elektrikli ve cesur ruhu.',
  },
];

export function getArtistPaletteById(id?: string): ArtistPalette | undefined {
  if (!id) return undefined;
  return ARTIST_PALETTES.find((p) => p.id === id);
}
