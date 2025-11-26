import { Component, OnInit, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-contact-section',
    templateUrl: './contact-section.component.html',
    styleUrls: ['./contact-section.component.scss'],
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule]
})
export class ContactSectionComponent implements OnInit, AfterViewInit {
    contactForm: FormGroup;
    @ViewChildren('contactCard') contactCards!: QueryList<ElementRef>;

    constructor(
        private formBuilder: FormBuilder,
        private router: Router
    ) {
        this.contactForm = this.formBuilder.group({
            name: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            subject: ['', Validators.required],
            message: ['', [Validators.required, Validators.minLength(10)]]
        });
    }

    ngOnInit(): void {
    }

    ngAfterViewInit(): void {
        this.setupIntersectionObserver();
    }

    setupIntersectionObserver(): void {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animated');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });

            this.contactCards.forEach(card => {
                observer.observe(card.nativeElement);
            });

            const animatedElements = document.querySelectorAll('.animate-on-scroll');
            animatedElements.forEach(el => {
                observer.observe(el as HTMLElement);
            });
        } else {
            this.contactCards.forEach(card => {
                card.nativeElement.classList.add('animated');
            });

            document.querySelectorAll('.animate-on-scroll').forEach(el => {
                (el as HTMLElement).classList.add('animated');
            });
        }
    }

    submitForm(): void {
        if (this.contactForm.valid) {
            this.showSuccessMessage();

            this.contactForm.reset();
        } else {
            Object.keys(this.contactForm.controls).forEach(key => {
                const control = this.contactForm.get(key);
                control?.markAsTouched();
            });
        }
    }

    showSuccessMessage(): void {
        alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
    }

    navigateTo(router: string): void {
        this.router.navigate([`/${router}`]);
    }
}