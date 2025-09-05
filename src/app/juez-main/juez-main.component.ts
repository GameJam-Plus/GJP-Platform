import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { SubmissionService } from '../services/submission.service';
import { Category, Site, Submission, Team, Theme, User } from '../../types';
import { SiteService } from '../services/site.service';
import { forkJoin } from 'rxjs';
import { TeamService } from '../services/team.service';
import { GamejamService } from '../services/gamejam.service';
import { CategoryService } from '../services/category.service';
import { ThemeService } from '../services/theme.service';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment.prod';

@Component({
  selector: 'app-juez-main',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './juez-main.component.html',
  styleUrl: './juez-main.component.css'
})
export class JuezMainComponent implements OnInit {
  games: any[] = []
  evaluations: any[] = []
  userId!: String | undefined
  selectedGame: string = ''
  gameInfoModal: string = "gameInfoModal";
  isHovered: boolean = false;
  targetTime: Date | undefined;
  timeRemaining: string | undefined;
  gameParameter!: string;
  evaluando: Boolean = false;
  dataSource: any = null;
  gameTitle: string = '';
  teamName: string = '';
  gameDescription: string = '';
  teamMembers: { name: string; discordUsername: string; email: string; }[] = [];
  themes: string[] = [];
  categories: string[] = [];
  gameLink: string = '';
  pitchLink: string = '';
  continuityPotential: number = 1;
  audienceCompetitorAwarenessValue: number = 1;
  marketPositioningValue: number = 1;
  gameDesignCoreLoopValue: number = 1;
  gameDesignHookValue: number = 1;
  gameDesignBalanceValue: number = 1;
  artVisualsCoherenceQualityValue: number = 1;
  audioDesignCoherenceQualityValue: number = 1;
  buildQualityValue: number = 1;
  UIUXQualityValue: number = 1;
  narrativeWorldBuildingValue: number = 1;
  pitchFeedback: string = "";
  gameDesignFeedback: string = "";
  artVisualsFeedback: string = "";
  audioDesignFeedback: string = "";
  buildFeedback: string = "";
  personalFeedback: string = "";
  loading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(private router: Router, private userService: UserService, private SubmissionService: SubmissionService, private TeamService: TeamService, private GameJamService: GamejamService, private CategoryService: CategoryService, private ThemeService: ThemeService){}

  ngOnInit(): void {
    this.loading = true;
    this.userService.getCurrentUser(`${environment.apiUrl}/api/user/get-user`)
    .subscribe(
      user => {
        this.userId = user._id;
        const url = `${environment.apiUrl}/api/submission/get-submissions-evaluator/${this.userId}`;
        this.GameJamService.getTimeRemainingData(`${environment.apiUrl}/api/game-jam/get-time-left-evaluator`)
        .subscribe(
          timeLeft => {
            const timeParts = timeLeft.split(':').map((part: string) => parseInt(part, 10));

            if (timeParts.length !== 4 || timeParts.some(isNaN)) {
              console.error("Invalid target time format");
              return;
            }

            const [days, hours, minutes, seconds] = timeParts;

            const totalMilliseconds =
              (days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds) * 1000;

            this.targetTime = new Date(Date.now() + totalMilliseconds);

            if (this.targetTime instanceof Date) {
              setInterval(() => {
                this.updateTimer();
              }, 1000);
            } else {
              console.error("Invalid target time format");
            }
          },
          () => {}
        );
        this.SubmissionService.getSubmissionsEvaluator(url).subscribe(
          (juegos: Submission[]) => {
            for (const juego of juegos){
              const urlj = `${environment.apiUrl}/api/team/get-team/` + juego.teamId
              this.TeamService.getTeamById(urlj).subscribe(
                (team: Team) => {
                  this.games.push(
                    {
                      id: juego._id,
                      name: juego.title,
                      team: team.teamName
                    }
                  );
                },
                error => {
                  console.error('Error al obtener juegos:', error);
                }
              )
            }
          },
          error => {
            console.error('Error al obtener juegos:', error);
          }
        );
        const url1 = `${environment.apiUrl}/api/submission/get-ratings-evaluator/${this.userId}`;
        this.SubmissionService.getSubmissionsEvaluator(url1).subscribe(
          (juegos: Submission[]) => {
            for (const juego of juegos){
              const urlj = `${environment.apiUrl}/api/team/get-team/` + juego.teamId
              this.TeamService.getTeamById(urlj).subscribe(
                (team: Team) => {
                  this.evaluations.push(
                    {
                      id: juego._id,
                      name: juego.title,
                      team: team.teamName
                    }
                  );
                },
                error => {
                  console.error('Error al obtener juegos:', error);
                }
              )
            }
          },
          error => {
            console.error('Error al obtener juegos:', error);
          }
        );
      },
      error => {
        console.error('Error al obtener usuario actual:', error);
      }
    );
    this.loading = false;
  }

  logOut(){
    this.userService.logOutUser(`${environment.apiUrl}/api/user/log-out-user`)
      .subscribe(
        () => {
          this.router.navigate(['/login']);
        },
        error => {
          console.error('Error al cerrar sesión:', error);
        }
      );
  }

  getNewEvaluation() {
    this.loading = false;
    this.SubmissionService.getCurrentTeamSubmission(`${environment.apiUrl}/api/submission/get-new-evaluation`).subscribe(
      (juego: Submission) => {
        const existingGame = this.games.find(game => game.id === juego._id);
        if (existingGame) {
          return;
        }

        const urlj = `${environment.apiUrl}/api/team/get-team/` + juego.teamId
        this.TeamService.getTeamById(urlj).subscribe(
          (team: Team) => {
            this.games.push(
              {
                id: juego._id,
                name: juego.title,
                team: team.teamName
              }
            );
          },
          error => {
            if (error.status === 400) {
              this.showErrorMessage(error);
            }
          }
        )
      },
      error => {
        this.showErrorMessage(error);
      }
    );
    this.loading = true;
  }
  showSuccessMessage(message: string) {
    this.successMessage = message;
  }

  showErrorMessage(message: string) {
    this.errorMessage = message;
  }

  updateTimer() {
    const now = new Date();

    if (this.targetTime instanceof Date) {
      const difference = this.targetTime.getTime() - now.getTime();
      if (difference <= 0) {
        this.timeRemaining = '0d 0h 0m 0s';
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      let timeRemainingStr = '';
      if (days > 0) {
        timeRemainingStr += `${days}d `;
      }
      if (hours > 0) {
        timeRemainingStr += `${hours}h `;
      }
      if (minutes > 0) {
        timeRemainingStr += `${minutes}m `;
      }
      if (seconds > 0) {
        timeRemainingStr += `${seconds}s`;
      }

      this.timeRemaining = timeRemainingStr.trim();
    } else {
      this.timeRemaining = '0d 0h 0m 0s';
    }
  }

  selectGame(id: string) {
    this.gameParameter = id;
    this.loadData();
  }


  submitEvaluation(): void {
    this.loading = true;
    const rating = {
      submissionId: this.gameParameter,
      continuityPotential: this.continuityPotential,
      audienceCompetitorAwarenessValue: this.audienceCompetitorAwarenessValue,
      marketPositioningValue: this.marketPositioningValue,
      gameDesignCoreLoopValue: this.gameDesignCoreLoopValue,
      gameDesignHookValue: this.gameDesignHookValue,
      gameDesignBalanceValue: this.gameDesignBalanceValue,
      artVisualsCoherenceQualityValue: this.artVisualsCoherenceQualityValue,
      audioDesignCoherenceQualityValue: this.audioDesignCoherenceQualityValue,
      buildQualityValue: this.buildQualityValue,
      UIUXQualityValue: this.UIUXQualityValue,
      narrativeWorldBuildingValue: this.narrativeWorldBuildingValue,
      pitchFeedback: this.pitchFeedback,
      gameDesignFeedback: this.gameDesignFeedback,
      artVisualsFeedback: this.artVisualsFeedback,
      audioDesignFeedback: this.audioDesignFeedback,
      buildFeedback: this.buildFeedback,
      personalFeedback: this.personalFeedback
  };
    this.SubmissionService.giveRating(`${environment.apiUrl}/api/submission/give-rating`, rating).subscribe({
      next: (data) => {
        if (data.success) {
          this.loading = false;
          alert("Evaluation Completed");
          this.ngOnInit();
          window.location.reload();
        } else {
        }
      },
      error: (error) => {
      },
    });

  }

  private loadData() {
    var url = `${environment.apiUrl}/api/submission/get-submission/` + this.gameParameter;
    this.SubmissionService.getSubmission(url).subscribe(
      (game: any) => {
        this.gameLink = game.game;
        this.pitchLink = game.pitch;
        this.gameTitle = game.title;

        const urlj = `${environment.apiUrl}/api/team/get-team/` + game.teamId;
        this.TeamService.getTeamById(urlj).subscribe(
          (team: Team) => {
            this.teamName = team.teamName;
            this.gameDescription = game.description;
            this.teamMembers = team.jammers.map(jammer => ({
              name: jammer.name,
              discordUsername: jammer.discordUsername,
              email: jammer.email
            }));

            const urlc = `${environment.apiUrl}/api/category/get-category/` + game.categoryId;
            this.CategoryService.getCategory(urlc).subscribe(
              (categories: Category) => {
                this.categories = [categories.titleEN];
                const urlt = `${environment.apiUrl}/api/theme/get-theme/` + game.themeId;
                this.ThemeService.getTheme(urlt).subscribe(
                  (theme: Theme) => {
                    this.themes = theme.titleEN !== undefined ? [theme.titleEN] : [];

                    const ratingUrl = `${environment.apiUrl}/api/submission/get-rating/` + game._id;
                    this.SubmissionService.getRating(ratingUrl).subscribe(
                      (rating: any) => {

                        this.dataSource = {
                          name: this.gameTitle,
                          team: this.teamName,
                          description: this.gameDescription,
                          teamMembers: this.teamMembers,
                          themes: this.themes,
                          categories: this.categories,
                          gameLink: this.gameLink,
                          pitchLink: this.pitchLink
                        };

                        if (rating.continuityPotential !== undefined) {
                          this.continuityPotential = rating.continuityPotential;
                        }
                        if (rating.audienceCompetitorAwarenessValue !== undefined) {
                            this.audienceCompetitorAwarenessValue = rating.audienceCompetitorAwarenessValue;
                        }
                        if (rating.marketPositioningValue !== undefined) {
                            this.marketPositioningValue = rating.marketPositioningValue;
                        }
                        if (rating.gameDesignCoreLoopValue !== undefined) {
                            this.gameDesignCoreLoopValue = rating.gameDesignCoreLoopValue;
                        }
                        if (rating.gameDesignHookValue !== undefined) {
                            this.gameDesignHookValue = rating.gameDesignHookValue;
                        }
                        if (rating.gameDesignBalanceValue !== undefined) {
                            this.gameDesignBalanceValue = rating.gameDesignBalanceValue;
                        }
                        if (rating.artVisualsCoherenceQualityValue !== undefined) {
                            this.artVisualsCoherenceQualityValue = rating.artVisualsCoherenceQualityValue;
                        }
                        if (rating.audioDesignCoherenceQualityValue !== undefined) {
                            this.audioDesignCoherenceQualityValue = rating.audioDesignCoherenceQualityValue;
                        }
                        if (rating.buildQualityValue !== undefined) {
                            this.buildQualityValue = rating.buildQualityValue;
                        }
                        if (rating.UIUXQualityValue !== undefined) {
                            this.UIUXQualityValue = rating.UIUXQualityValue;
                        }
                        if (rating.narrativeWorldBuildingValue !== undefined) {
                            this.narrativeWorldBuildingValue = rating.narrativeWorldBuildingValue;
                        }
                        if (rating.pitchFeedback !== undefined) {
                            this.pitchFeedback = rating.pitchFeedback;
                        }
                        if (rating.gameDesignFeedback !== undefined) {
                            this.gameDesignFeedback = rating.gameDesignFeedback;
                        }
                        if (rating.artVisualsFeedback !== undefined) {
                            this.artVisualsFeedback = rating.artVisualsFeedback;
                        }
                        if (rating.audioDesignFeedback !== undefined) {
                            this.audioDesignFeedback = rating.audioDesignFeedback;
                        }
                        if (rating.buildFeedback !== undefined) {
                            this.buildFeedback = rating.buildFeedback;
                        }
                        if (rating.personalFeedback !== undefined) {
                            this.personalFeedback = rating.personalFeedback;
                        }

                      },
                      error => {
                        console.error('Error al obtener la puntuación del juego:', error);
                      }
                    );
                  },
                  error => {
                    console.error('Error al obtener el tema:', error);
                  }
                );
              },
              error => {
                console.error('Error al obtener la categoría:', error);
              }
            );
          },
          error => {
            console.error('Error al obtener el equipo:', error);
          }
        );
      },
      error => {
        console.error('Error al obtener el juego:', error);
      }
    );
  }


}
