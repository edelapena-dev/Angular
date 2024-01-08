import { Component, OnInit } from '@angular/core';
import { HeroesService } from '../../services/heroes.service';
import { FormControl, FormGroup } from '@angular/forms';
import { Hero, Publisher } from '../../interfaces/hero.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, switchMap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'app-new-page',
    templateUrl: './new-page.component.html',
    styles: ``
})
export class NewPageComponent implements OnInit {

    public heroForm = new FormGroup(
        {
            id: new FormControl<string>(''),
            superhero: new FormControl<string>('', { nonNullable: true }),
            publisher: new FormControl<Publisher>(Publisher.DCComics),
            alter_ego: new FormControl<string>(''),
            first_appearance: new FormControl<string>(''),
            characters: new FormControl<string>(''),
            alt_img: new FormControl<string>('')
        }
    );

    public publishers = [
        {
            id: 'DC Comics',
            value: 'DC - Comics'
        },
        {
            id: 'Marvel Comics',
            value: 'Marvel - Comics'
        }
    ]

    constructor(private heroesService: HeroesService,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private snackbar: MatSnackBar,
        private dialog: MatDialog) {

    }

    ngOnInit(): void {
        if (!this.router.url.includes('edit')) return;
        this.activatedRoute.params.pipe(
            switchMap(({ id }) => this.heroesService.getHeroById(id))
        ).subscribe(hero => {
            if (!hero) return this.router.navigateByUrl('/');
            this.heroForm.reset(hero);
            return;
        })
    }

    get currentHero(): Hero {
        const hero = this.heroForm.value as Hero;
        return hero;
    }

    addHero() {
        if (this.heroForm.invalid) return;
        if (this.currentHero.id) {
            this.heroesService.updateHero(this.currentHero)
                .subscribe(hero => {
                    //TODO: mostrar snackbar
                    this.showSnackBar(`${hero.superhero} updated!`);
                });
            return;
        }
        this.heroesService.addHero(this.currentHero)
            .subscribe(hero => {
                //TODO: mostrar snackbar, y navegar a /heroes/edit/hero.id
                this.router.navigate(['/heroes/edit', hero.id]);
                this.showSnackBar(`${hero.superhero} created!`);
            });

        console.log({
            formIsValid: this.heroForm.valid,
            value: this.heroForm.value
        })
    }

    onDeleteHero() {
        if (!this.currentHero) throw Error('Hero id is required');

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: this.heroForm.value
        });

        dialogRef.afterClosed()
            .pipe(
                filter((result: boolean) => result),
                switchMap(() => this.heroesService.deleteHeroById(this.currentHero.id)),
                filter((wasDeleted: boolean) => wasDeleted),
            )
            .subscribe(() => {
                this.router.navigate(['/heroes'])
            });
        //TODO otra forma de realizar el delete
        // dialogRef.afterClosed().subscribe(result => {
        //     if (!result) return;
        //     this.heroesService.deleteHeroById(this.currentHero.id)
        //         .subscribe(wasDeleted => {
        //             if (wasDeleted)
        //                 this.router.navigate(['/heroes']);
        //         });
        // });
    }

    showSnackBar(message: string): void {
        this.snackbar.open(message, 'done', {
            duration: 2500
        })
    }

}
