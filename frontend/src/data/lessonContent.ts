// Lesson content for all 9 chapters
// Video citations are verbatim from the <font size="5"> caption blocks
// in each chapter's intro page (1n.html – 9n.html) of the legacy prototype.

export interface LessonSlide {
  /** Unique key for this slide */
  id: string;
  /** Image to display (relative to /assets/images/) */
  image?: string;
  /** Image set to display together (relative to /assets/images/) */
  images?: string[];
  /** How grouped images should be rendered */
  groupedImageSizing?: 'uniform' | 'natural';
  /** Video to display (relative to /assets/videos/) */
  video?: string;
  /** English label */
  labelEn: string;
  /** Filipino label */
  labelFil?: string;
  /** Path to English pronunciation audio (relative to /assets/audio/audio/) */
  audioEn?: string;
  /** Path to Filipino pronunciation audio (relative to /assets/audio/audio/) */
  audioFil?: string;
}

export interface TopicLesson {
  topic: string;
  /** Path to video (relative to /assets/videos/) */
  videoSrc: string;
  /** Full verbatim title from the legacy prototype caption block */
  videoTitle: string;
  /** Creator credit from the legacy prototype caption block */
  videoCredit: string;
  /** Slides for the lesson proper stage */
  slides: LessonSlide[];
}

// Helper for audio paths
const aud = (file: string) => `/assets/audio/audio/${file}`;

export const lessonContent: Record<string, TopicLesson> = {

  // ─── Chapter 1: Colors ──────────────────────────────────────────────────────
  // Source: 1n.html / 1a.html
  colors: {
    topic: 'colors',
    videoSrc: '/assets/videos/color.mp4',
    videoTitle: 'Mga Kulay Song by Teacher Cathy',
    videoCredit: 'Cher Cathy Lyn',
    slides: [
      { id: 'c-red', image: '1red.png', labelEn: 'Red', labelFil: 'Pula', audioEn: aud('1red.MP3'), audioFil: aud('1pula.MP3') },
      { id: 'c-orange', image: '1or.png', labelEn: 'Orange', labelFil: 'Kahel', audioEn: aud('1orange.mp3'), audioFil: aud('1kahel.MP3') },
      { id: 'c-yellow', image: '1yel.png', labelEn: 'Yellow', labelFil: 'Dilaw', audioEn: aud('1yellow.mp3'), audioFil: aud('1dilaw.MP3') },
      { id: 'c-green', image: '1grn.png', labelEn: 'Green', labelFil: 'Berde', audioEn: aud('1green.mp3'), audioFil: aud('1berde.MP3') },
      { id: 'c-blue', image: '1blu.png', labelEn: 'Blue', labelFil: 'Asul', audioEn: aud('1blue.mp3'), audioFil: aud('1asul.MP3') },
      { id: 'c-violet', image: '1vio.png', labelEn: 'Violet', labelFil: 'Lila', audioEn: aud('1violet.mp3'), audioFil: aud('1lila.MP3') },
      { id: 'c-pink', image: '1pink.png', labelEn: 'Pink', labelFil: 'Rosas', audioEn: aud('1pink.mp3'), audioFil: aud('1rosas.MP3') },
      { id: 'c-white', image: '1whi.png', labelEn: 'White', labelFil: 'Puti', audioEn: aud('1white.mp3'), audioFil: aud('1puti.MP3') },
      { id: 'c-brown', image: '1bro.png', labelEn: 'Brown', labelFil: 'Kayumanggi', audioEn: aud('1brown.mp3'), audioFil: aud('1kayu.MP3') },
      { id: 'c-black', image: '1bla.png', labelEn: 'Black', labelFil: 'Itim', audioEn: aud('1black.mp3'), audioFil: aud('1itim.MP3') },
      { id: 'c-gray', image: '1gra.png', labelEn: 'Gray', labelFil: 'Kulay Abo', audioEn: aud('1gray.MP3'), audioFil: aud('1abo.MP3') },
    ],
  },

  // ─── Chapter 2: Shapes ──────────────────────────────────────────────────────
  // Source: 2n.html / 2a.html
  shapes: {
    topic: 'shapes',
    videoSrc: '/assets/videos/shapes.mp4',
    videoTitle: '(KinderTV Sing-along!) "Mga Hugis"',
    videoCredit: 'SMES KinderTV',
    slides: [
      { id: 's-triangle', image: 'shape-replacement-1.png', labelEn: 'Triangle', labelFil: 'Tatsulok', audioEn: aud('2t.mp3'), audioFil: aud('2tat.MP3') },
      { id: 's-circle', image: 'shape-replacement-2.png', labelEn: 'Circle', labelFil: 'Bilog', audioEn: aud('2c.mp3'), audioFil: aud('2bil.MP3') },
      { id: 's-square', image: 'shape-replacement-3.png', labelEn: 'Square', labelFil: 'Parisukat', audioEn: aud('2sq.mp3'), audioFil: aud('2pari.MP3') },
      { id: 's-rectangle', image: 'shape-replacement-4.png', labelEn: 'Rectangle', labelFil: 'Parihaba', audioEn: aud('2r.mp3'), audioFil: aud('2parih.MP3') },
      { id: 's-oval', image: 'shape-replacement-5.png', labelEn: 'Oval', labelFil: 'Habilog o Obalo', audioEn: aud('2o.mp3'), audioFil: aud('2hab.MP3') },
    ],
  },

  // ─── Chapter 3: Sequencing ──────────────────────────────────────────────────
  // Source: 3n.html / 3a.html — alphabet, number sequence, size ordering
  sequencing: {
    topic: 'sequencing',
    videoSrc: '/assets/videos/alpabasa.mp4',
    videoTitle: 'Awit ng Alpabasa',
    videoCredit: 'Original Musical Arrangement and Recording by Lester Delgado\nLyrics by Aina Valencia and Tisha Cruz\nSung by Eliza Tiongson\nStarring Alexa G. Cruz\n\nVisit www.alpabasa.com to learn more about the Alpabasa Reading Program.',
    slides: [
      {
        id: 'sq-count',
        images: ['1n0.png', '1n1.png', '1n2.png', '1n3.png', '1n4.png', '1n5.png', '1n6.png', '1n7.png', '1n8.png', '1n9.png', '1n10.png'],
        labelEn: 'Numbers 0 to 10',
      },
      { id: 'sq-alpha', image: 'alp.png', labelEn: 'The Alphabet' },
      {
        id: 'sq-size',
        images: ['sn1.png', 'sn2.png', 'sn3.png', 'sn4.png', 'sn5.png'],
        groupedImageSizing: 'natural',
        labelEn: 'Size Order',
      },
      { id: 'sq-pattern-1', image: 'r.png', labelEn: 'Alin ang susunod?' },
      { id: 'sq-pattern-2', image: 'r1.png', labelEn: 'Alin ang susunod?' },
      { id: 'sq-pattern-3', image: 'r2.png', labelEn: 'Alin ang susunod?' },
    ],
  },

  // ─── Chapter 4: Addition ────────────────────────────────────────────────────
  // Source: 4n.html / 4.html
  addition: {
    topic: 'addition',
    videoSrc: '/assets/videos/add.mp4',
    videoTitle: 'Motivational Song in Math 1 Pagdaragdag',
    videoCredit: 'Teacher Nim',
    slides: [
      { id: 'add-concept', image: 'dag.png', labelEn: 'Addition means adding' },
      { id: 'add-a', image: '4a.png', labelEn: 'Adding groups' },
      { id: 'add-b', image: 'add-replacement-1.png', labelEn: 'Example 1' },
      { id: 'add-c', image: 'add-replacement-2.png', labelEn: 'Example 2' },
      { id: 'add-d', image: 'add-replacement-3.png', labelEn: 'Example 3' },
      { id: 'add-e', image: 'add-replacement-4.png', labelEn: 'Example 4' },
      { id: 'add-f', image: 'add-replacement-5.png', labelEn: 'Example 5' },
      { id: 'add-g', image: 'add-replacement-6.png', labelEn: 'Example 6' },
      { id: 'add-411', image: '411.png', labelEn: 'Example 7' },
      { id: 'add-412', image: '412.png', labelEn: 'Example 8' },
      { id: 'add-413', image: '413.png', labelEn: 'Example 9' },
      { id: 'add-414', image: '414.png', labelEn: 'Example 10' },
      { id: 'add-415', image: '415.png', labelEn: 'Example 11' },
      { id: 'add-416', image: '416.png', labelEn: 'Example 12' },
      { id: 'add-417', image: '417.png', labelEn: 'Example 13' },
      { id: 'add-418', image: '418.png', labelEn: 'Example 14' },
      { id: 'add-419', image: '419.png', labelEn: 'Example 15' },
      { id: 'add-420', image: '420.png', labelEn: 'Example 16' },
      { id: 'add-v1', video: '4v1.mp4', labelEn: 'Video 1' },
      { id: 'add-v2', video: '4v2.mp4', labelEn: 'Video 2' },
    ],
  },

  // ─── Chapter 5: Subtraction ─────────────────────────────────────────────────
  // Source: 5n.html / 5.html
  subtraction: {
    topic: 'subtraction',
    videoSrc: '/assets/videos/sub.mp4',
    videoTitle: 'CHIKADING | Tagalog Energizer Action Subtraction Song | Pinoy BK Channel 🇵🇭',
    videoCredit: 'Pinoy BK Channel',
    slides: [
      { id: 'sub-concept', image: 'bawas.png', labelEn: 'Subtraction means taking away' },
      { id: 'sub-v1', video: '5subv.mp4', labelEn: 'Video 1' },
      { id: 'sub-v2', video: '5v1.mp4', labelEn: 'Video 2' },
      { id: 'sub-b', image: '5pa.png', labelEn: 'Example 1' },
      { id: 'sub-c', image: 'sub-replacement-1.png', labelEn: 'Example 2' },
      { id: 'sub-d', image: 'sub-replacement-2.png', labelEn: 'Example 3' },
      { id: 'sub-e', image: '5pd.png', labelEn: 'Example 4' },
      { id: 'sub-f', image: 'sub-replacement-3.png', labelEn: 'Example 5' },
      { id: 'sub-g', image: '5f.jpg', labelEn: 'Example 6' },
      { id: 'sub-h', image: '5g.jpg', labelEn: 'Example 7' },
      { id: 'sub-i', image: 'sub-replacement-4.png', labelEn: 'Example 8' },
      { id: 'sub-j', image: '5i.jpg', labelEn: 'Example 9' },
      { id: 'sub-k', image: 'sub-replacement-5.png', labelEn: 'Example 10' },
      { id: 'sub-l', image: '5k.jpg', labelEn: 'Example 11' },
      { id: 'sub-m', image: '5l.jpg', labelEn: 'Example 12' },
      { id: 'sub-n', image: '5m.jpg', labelEn: 'Example 13' },
      { id: 'sub-o', image: '5n.jpg', labelEn: 'Example 14' },
      { id: 'sub-p', image: 'sub-replacement-6.png', labelEn: 'Example 15' },
    ],
  },

  // ─── Chapter 6: Numbers ─────────────────────────────────────────────────────
  // Source: 6n.html / 6.html — numbers 0–10 with images + bilingual audio
  numbers: {
    topic: 'numbers',
    videoSrc: '/assets/videos/num.mp4',
    videoTitle: 'Isa, Dalawa, Tatlo | Filipino Nursery Rhymes & Songs | Awiting Pambata',
    videoCredit: 'Flexy Bear',
    slides: [
      { id: 'n-0', image: '60.png', labelEn: 'Zero', labelFil: 'Wala', audioEn: aud('60.mp3'), audioFil: aud('6v0.MP3') },
      { id: 'n-1', image: '61.png', labelEn: 'One', labelFil: 'Isa', audioEn: aud('61.mp3'), audioFil: aud('6v1.MP3') },
      { id: 'n-2', image: '62.png', labelEn: 'Two', labelFil: 'Dalawa', audioEn: aud('62.mp3'), audioFil: aud('6v2.MP3') },
      { id: 'n-3', image: '63.png', labelEn: 'Three', labelFil: 'Tatlo', audioEn: aud('63.mp3'), audioFil: aud('6v3.MP3') },
      { id: 'n-4', image: '64.png', labelEn: 'Four', labelFil: 'Apat', audioEn: aud('64.mp3'), audioFil: aud('6v4.MP3') },
      { id: 'n-5', image: '65.png', labelEn: 'Five', labelFil: 'Lima', audioEn: aud('65.mp3'), audioFil: aud('6v5.MP3') },
      { id: 'n-6', image: '66.png', labelEn: 'Six', labelFil: 'Anim', audioEn: aud('66.mp3'), audioFil: aud('6v6.MP3') },
      { id: 'n-7', image: '67.png', labelEn: 'Seven', labelFil: 'Pito', audioEn: aud('67.mp3'), audioFil: aud('6v7.MP3') },
      { id: 'n-8', image: '68.png', labelEn: 'Eight', labelFil: 'Walo', audioEn: aud('68.mp3'), audioFil: aud('6v8.MP3') },
      { id: 'n-9', image: '69.png', labelEn: 'Nine', labelFil: 'Siyam', audioEn: aud('69.mp3'), audioFil: aud('6v9.MP3') },
      { id: 'n-10', image: '610-lesson.jpg', labelEn: 'Ten', labelFil: 'Sampu', audioEn: aud('610.mp3'), audioFil: aud('6v10.MP3') },
      { id: 'n-11', image: '611.png', labelEn: 'Eleven', labelFil: 'Labing-isa', audioEn: aud('611.mp3'), audioFil: aud('6v11.MP3') },
      { id: 'n-12', image: '612.png', labelEn: 'Twelve', labelFil: 'Labing-dalawa', audioEn: aud('612.mp3'), audioFil: aud('6v12.MP3') },
      { id: 'n-13', image: '613.png', labelEn: 'Thirteen', labelFil: 'Labing-tatlo', audioEn: aud('613.mp3'), audioFil: aud('6v13.MP3') },
      { id: 'n-14', image: '614.png', labelEn: 'Fourteen', labelFil: 'Labing-apat', audioEn: aud('614.mp3'), audioFil: aud('6v14.MP3') },
      { id: 'n-15', image: '615.png', labelEn: 'Fifteen', labelFil: 'Labing-lima', audioEn: aud('615.mp3'), audioFil: aud('6v15.MP3') },
      { id: 'n-16', image: '616.png', labelEn: 'Sixteen', labelFil: 'Labing-anim', audioEn: aud('616.mp3'), audioFil: aud('6v16.MP3') },
      { id: 'n-17', image: '617.png', labelEn: 'Seventeen', labelFil: 'Labing-pito', audioEn: aud('617.mp3'), audioFil: aud('6v17.MP3') },
      { id: 'n-18', image: '618.png', labelEn: 'Eighteen', labelFil: 'Labingwalo', audioEn: aud('618.mp3'), audioFil: aud('6v18.MP3') },
      { id: 'n-19', image: '619.png', labelEn: 'Nineteen', labelFil: 'Labing-siyam', audioEn: aud('619.mp3'), audioFil: aud('6v19.MP3') },
      { id: 'n-20', image: '620.png', labelEn: 'Twenty', labelFil: 'Dalawampu', audioEn: aud('620.mp3'), audioFil: aud('6v20.MP3') },
    ],
  },

  // ─── Chapter 7: Measurement ─────────────────────────────────────────────────
  // Source: 7n.html / 7.html — comparing sizes/lengths
  measurement: {
    topic: 'measurement',
    videoSrc: '/assets/videos/comp.mp4',
    videoTitle: 'Maliliit at Malalaking Hayop | Flexy Bear Original Awiting Pambata Nursery Rhymes & Songs',
    videoCredit: 'Flexy Bear',
    slides: [
      { id: 'm-intro', image: '7su.png', labelEn: 'Measurement' },
      { id: 'm-v1', video: 'mvlength.mp4', labelEn: 'Video 1' },
      { id: 'm-v2', video: 'mv2.mp4', labelEn: 'Video 2' },
      { id: 'm-v3', video: 'mv3.mp4', labelEn: 'Video 3' },
      { id: 'm-v4', video: 'mvb.mp4', labelEn: 'Video 4' },
      { id: 'm-6', image: 'mt.png', labelEn: 'Example 1' },
      { id: 'm-1', image: 'mt1.png', labelEn: 'Example 2' },
      { id: 'm-2', image: 'mt2.png', labelEn: 'Example 3' },
      { id: 'm-5', image: 'mt5.png', labelEn: 'Example 4' },
      { id: 'm-7', image: 'mt6.png', labelEn: 'Example 5' },
      { id: 'm-3', image: 'mt3.png', labelEn: 'Example 6' },
      { id: 'm-4', image: 'mt4.png', labelEn: 'Example 7' },
      { id: 'm-8', image: 'mt9.png', labelEn: 'Example 8' },
      { id: 'm-9', image: 'mt12.png', labelEn: 'Example 9' },
      { id: 'm-10', image: 'mt8.png', labelEn: 'Example 10' },
      { id: 'm-11', image: 'mt11.png', labelEn: 'Example 11' },
      { id: 'm-12', image: 'mt10.png', labelEn: 'Example 12' },
      { id: 'm-13', image: 'mt13.png', labelEn: 'Example 13' },
    ],
  },

  // ─── Chapter 8: Comparison ──────────────────────────────────────────────────
  // Source: 8n.html / 8.html
  // Note: creator credit reads only "~ A" in the source HTML — incomplete attribution.
  comparison: {
    topic: 'comparison',
    videoSrc: '/assets/videos/sukat.mp4',
    videoTitle: 'Haba at ikli | Awit ng Pagsukat | Pambata',
    videoCredit: 'Unknown', // original source reads "~ A" — incomplete
    slides: [
      { id: 'cmp-intro', image: 'kum.png', labelEn: 'Comparison' },
      { id: 'cmp-v1', video: 'comv.mp4', labelEn: 'Video 1' },
      { id: 'cmp-v2', video: 'cvlength.mp4', labelEn: 'Video 2' },
      { id: 'cmp-v3', video: 'cv2.mp4', labelEn: 'Video 3' },
      { id: 'cmp-v4', video: 'cvb.mp4', labelEn: 'Video 4' },
      { id: 'cmp-v5', video: 'cv5.mp4', labelEn: 'Video 5' },
      { id: 'cmp-3', image: 'cp3.png', labelEn: 'Example 1' },
      { id: 'cmp-4', image: 'cp4.png', labelEn: 'Example 2' },
      { id: 'cmp-1', image: 'cp1.png', labelEn: 'Example 3' },
      { id: 'cmp-2', image: 'cp2.png', labelEn: 'Example 4' },
      { id: 'cmp-5', image: 'cp5.png', labelEn: 'Example 5' },
      { id: 'cmp-6', image: 'cp6.png', labelEn: 'Example 6' },
      { id: 'cmp-7', image: 'cp7.png', labelEn: 'Example 7' },
      { id: 'cmp-8', image: 'cp8.jpg', labelEn: 'Example 8' },
    ],
  },

  // ─── Chapter 9: Telling Time ─────────────────────────────────────────────────
  // Source: 9n.html / 9na.html — clock faces 1–12 o'clock with audio
  clock: {
    topic: 'clock',
    videoSrc: '/assets/videos/ov.mp4',
    videoTitle: '"Orasan" — Grade 1 Action Song — "Pagsabi at Pagsulat ng Oras gamit ang Orasang Analogo"',
    videoCredit: 'Teacher Glie',
    slides: [
      { id: 'cl-intro', image: '9ora.png', labelEn: 'Telling Time' },
      { id: 'cl-1', image: '21o.png', labelEn: '1 o\'clock', audioEn: aud('21v.mp3') },
      { id: 'cl-2', image: '22o.png', labelEn: '2 o\'clock', audioEn: aud('22v.mp3') },
      { id: 'cl-3', image: '23o.png', labelEn: '3 o\'clock', audioEn: aud('23v.mp3') },
      { id: 'cl-4', image: '24o.png', labelEn: '4 o\'clock', audioEn: aud('24v.mp3') },
      { id: 'cl-5', image: '25o.png', labelEn: '5 o\'clock', audioEn: aud('25v.mp3') },
      { id: 'cl-6', image: '26o.png', labelEn: '6 o\'clock', audioEn: aud('26v.mp3') },
      { id: 'cl-7', image: '27o.png', labelEn: '7 o\'clock', audioEn: aud('27v.mp3') },
      { id: 'cl-8', image: '28o.png', labelEn: '8 o\'clock', audioEn: aud('28v.mp3') },
      { id: 'cl-9', image: '29o.png', labelEn: '9 o\'clock', audioEn: aud('29v.mp3') },
      { id: 'cl-10', image: '210o.png', labelEn: '10 o\'clock', audioEn: aud('210v.mp3') },
      { id: 'cl-11', image: '211o.png', labelEn: '11 o\'clock', audioEn: aud('211v.mp3') },
      { id: 'cl-12', image: '212o.png', labelEn: '12 o\'clock', audioEn: aud('212v.mp3') },
    ],
  },
};
