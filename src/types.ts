import { HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';

export enum JamStage {
  PITCH_SUBMISSION = 'Pitch',
  SEMIFINAL_SUBMISSION = 'Semifinal Submission',
  
  PRE_PRODUCTION = 'Pre-production',
  REGISTER = 'Register',
  GAMEJAM = 'GameJam',
  GAMEJAM_SUBMISSION = 'GameJam Submission',
  INCUBATION = 'Incubation',
  INCUBATION_SUBMISSION = 'Incubation Submission',
  INCUBATION_EVALUATION = 'Incubation Evaluation',
  CONTINENTAL_SEMIFINAL = 'Continental Semifinal',
  ACCELERATION = 'Acceleration',
  ACCELERATION_SUBMISSION = 'Acceleration Submission',
  ACCELERATION_EVALUATION = 'Acceleration Evaluation',
  GLOBAL_FINAL = 'Global Final'
}

export interface Options {
  headers?:
    | HttpHeaders
    | {
        [header: string]: string | string[];
      };
  observe?: 'body';
  context?: HttpContext;
  params?:
    | HttpParams
    | {
        [param: string]:
          | string
          | number
          | boolean
          | ReadonlyArray<string | number | boolean>;
      };
  reportProgress?: boolean;
  responseType?: 'json';
  withCredentials?: boolean;
  transferCache?:
    | {
        includeHeaders?: string[];
      }
    | boolean;
}

export interface User {
  _id?: string;
  name: string;
  email: string;
  discordUsername: string;
  gender?: string;
  socialMedia?: string;
  region?: {
    _id: string;
    name: string;
  };
  site?: {
    _id: string;
    name: string;
  };
  team?: {
    _id: string;
    name: string;
  };
  roles: string[];
  role?: string;
  coins: number;
  creationDate?: Date;
  lastUpdateDate?: Date;
}

export interface Site {
    _id?: string;
    name: string;
    code?: string;
    open?: number;
    modality?: string;
    description?: string;
    phoneNumber?: string;
    email?: string;
    address?: string;
    server?: string;
    website?: string;
    instagram?: string;
    discord?: string;
    whatsapp?: string;
    language?: string;
    regionId: string;
    startTime?: string;
    country: {
      name: string;
      code: string;
    };
    city?: string;
    igda?: boolean;
    customSubmissionTime?: string;
}

export interface Region {
    _id?: string;
    name: string;
}

export interface Category {
  _id?: string;
  titleSP: string;
  titleEN: string;
  titlePT: string;
  descriptionSP: string;
  descriptionEN: string;
  descriptionPT: string;
  manualSP: File | null;
  manualEN: File | null;
  manualPT: File | null;
}


export interface Country {
  name: string;
  code: string;
}

export interface GameJam {
  _id?: string;
  edition: string;
  themes: {
    _id?: string;
    titleEN?: string;
  }[];
}

export interface Jam {
  _id?: string,
  title: string,
  open: boolean,
  public: boolean,
  toolboxGuides?: string,
  toolboxArts?: string,
  toolboxPresentations?: string,
  themes: {
    titlePT: string,
    titleES: string,
    titleEN: string,
    descriptionPT: string,
    descriptionES: string,
    descriptionEN: string,
    manualPT: string,
    manualES: string,
    manualEN: string
  }[],
  categories: {
    titlePT: string,
    titleES: string,
    titleEN: string,
    descriptionPT: string,
    descriptionES: string,
    descriptionEN: string,
    manualPT: string,
    manualES: string,
    manualEN: string
  }[],
  stages: {
    stageName: string,
    startDate: Date,
    endDate: Date,
    roles: {
      roleName: string
    }[]
  }[]
}

export interface Stage {
  _id?: string;
  name: string;
  startDate: Date;
  endDate: Date;
  startDateEvaluation: Date;
  endDateEvaluation: Date;
  gameJam: {
    _id: string;
    edition: string;
  };
}

export interface Team {
  _id?: string;
  teamName: string;
  teamCode?: string;
  siteId: string;
  jamId: string;
  jammers: [{
    _id: string;
    name: string;
    email: string;
    discordUsername: string;
    role?: string;
  }]
}

export interface Theme {
  _id?: string;
  manualSP: File | null;
  manualEN: File | null;
  manualPT: File | null;
  descriptionSP: string;
  descriptionPT: string;
  descriptionEN: string;
  titleSP: string;
  titleEN: string;
  titlePT: string;
}

export interface Member {
    _id: string;
    name: string;
    email: string;
    discordUsername: string;
}

export interface Chat {
  _id: string;
  participants: {
    participantType: 'User' | 'Team';
    participantId?: string;
  }[];
  messagesList: {
    sender: string;
    senderType: 'User' | 'Team';
    message: string;
    sentDate: Date;
  }[];
}

export interface Submission {
  // General information
  _id?: string;
  jamId: string,
  siteId: string,
  teamId: string,
  jammerId: string,

  // Informations for the gamejam form
  gamejamTitle: string;
  gamejamContact: {
    _id: string,
    name: string,
    email: string
  },
  gamejamBuild: string;
  gamejamDescription: string;
  gamejamThemes: string[];
  gamejamCategories: string[];
  gamejamTopics: string[];
  gamejamGenres: string[];
  gamejamPlatforms: string[];
  gamejamGraphics: string;
  gamejamEngine: string;
  goingToIncubation: boolean;
  gamejamAuthorization: boolean;
  gamejamRecommendation: number;
  gamejamEnjoyment: number;
  gamejamSuggestions: string;
  gamejamSubmissionTime: Date;
  gamejamSubmissionDelta: number;
  
  // Informations for the gamejam pitch form
  gamejamPitch?: string;
  gamejamPitchJammerId?: string,
  gamejamPitchTime?: Date;
  gamejamPitchDelta?: number;
  
  // Informations for the incubation form
  incubationJammerId?: string,
  incubationTitle?: string;
  incubationContact?: {
    _id?: string,
    name?: string,
    email?: string
  },
  incubationBuild?: string;
  incubationDescription?: string;
  incubationThemes?: string[];
  incubationCategories?: string[];
  incubationTopics?: string[];
  incubationGenres?: string[];
  incubationPlatforms?: string[];
  incubationGraphics?: string;
  incubationEngine?: string;
  goingToAcceleration?: boolean;
  incubationAuthorization?: boolean;
  incubationRecommendation?: number;
  incubationEnjoyment?: number;
  incubationSuggestions?: string;
  incubationSubmissionTime?: Date;
  incubationSubmissionDelta?: number;  

  // Informations for the incubation pitch form
  incubationPitch?: string;
  incubationPitchJammerId?: string,
  incubationPitchTime?: Date;
  incubationPitchDelta?: number;

  // Informations for the acceleration form
  accelerationJammerId?: string,
  accelerationTime?: Date;
  accelerationTimeDelta?: number;
  accelerationBuild?: string;
  accelerationDescription?: string;
  accelerationThemes?: string[];
  accelerationCategories?: string[];
  accelerationTopics?: string[];
  accelerationGenres?: string[];
  accelerationPlatforms?: string[];
  accelerationGraphics?: string;
  accelerationEngine?: string;
  accelerationAuthorization?: boolean;
  accelerationRecommendation?: number;
  accelerationEnjoyment?: number;
  accelerationSuggestions?: string;
  accelerationSubmissionTime?: Date;
  accelerationSubmissionDelta?: number;

  accelerationGameplayVideo?: string; // Remove later
  accelerationSoundtrack?: string; // Remove later

  // Informations for the acceleration pitch form
  accelerationPitch?: string;
  accelerationPitchJammerId?: string,
  accelerationPitchTime?: Date;
  accelerationPitchDelta?: number;
}

export interface Rating {
  pitchScore?: Number;
  pitchFeedback?: String;
  gameDesignScore?: Number;
  gameDesignFeedback?: String;
  artScore?: Number;
  artFeedback?: String;
  buildScore?: Number;
  buildFeedback?: String;
  audioScore?: Number;
  audioFeedback?: String;
  generalFeedback?: String;
}
