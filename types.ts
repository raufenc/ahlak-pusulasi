
export interface Option {
  text: string;
  puan: number;
}

export interface Question {
  soru: string;
  options: Option[];
}

export interface TestConcepts {
  tefrit: string;
  fazilet: string;
  ifrat: string;
}

export interface Test {
  title: string;
  concepts: TestConcepts;
  questions: Question[];
}

export interface Tests {
  [key: string]: Test;
}

export interface GeminiResult {
  selamlama: string;
  sonuclarinAynasi: string;
  tefekkurKosesi: string;
  ilahiRehberlik: string;
  pratikAdimlar: string;
  sonraki_test: {
    key: string;
    gerekce: string;
  };
}
