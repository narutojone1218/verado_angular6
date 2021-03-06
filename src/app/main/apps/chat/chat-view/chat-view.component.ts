import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ViewChildren } from '@angular/core';
import { NgForm, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { VeradoPerfectScrollbarDirective } from '@verado/directives/verado-perfect-scrollbar/verado-perfect-scrollbar.directive';
import { VeradoConfirmDialogComponent } from '@verado/components/confirm-dialog/confirm-dialog.component';

import { ChatService } from '../chat.service';
import { MatDialog, MatDialogRef, MatSnackBar } from '@angular/material';
import { ContactsContactFormDialogComponent } from '../contact-form/contact-form.component';

@Component({
    selector   : 'chat-view',
    templateUrl: './chat-view.component.html',
    styleUrls  : ['./chat-view.component.scss']
})
export class ChatViewComponent implements OnInit, OnDestroy, AfterViewInit
{
    user: any;
    chat: any;
    dialog: any;
    contact: any;
    replyInput: any;
    selectedChat: any;
    dialogRef: any;
    confirmDialogRef: MatDialogRef<VeradoConfirmDialogComponent>;


    @ViewChild(VeradoPerfectScrollbarDirective)
    directiveScroll: VeradoPerfectScrollbarDirective;

    @ViewChildren('replyInput')
    replyInputField;

    @ViewChild('replyForm')
    replyForm: NgForm;

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {ChatService} _chatService
     */
    constructor(
        private _chatService: ChatService,
        private _matDialog: MatDialog,
        private _matSnackBar: MatSnackBar,
    )
    {
        // Set the private defaults
        this._unsubscribeAll = new Subject();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        this.user = this._chatService.user;
        this._chatService.onChatSelected
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(chatData => {
                if ( chatData )
                {
                    this.selectedChat = chatData;
                    this.contact = chatData.contact;
                    this.dialog = chatData.dialog;
                    this.readyToReply();
                }
            });
    }

    /**
     * After view init
     */
    ngAfterViewInit(): void
    {
        this.replyInput = this.replyInputField.first.nativeElement;
        this.readyToReply();
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Select contact
     */
    selectContact(): void
    {
        this._chatService.selectContact(this.contact);
    }

    /**
     * Ready to reply
     */
    readyToReply(): void
    {
        setTimeout(() => {
            this.replyForm.reset();
            this.focusReplyInput();
            this.scrollToBottom();
        });

    }

    /**
     * Focus to the reply input
     */
    focusReplyInput(): void
    {
        setTimeout(() => {
            this.replyInput.focus();
        });
    }

    /**
     * Scroll to the bottom
     *
     * @param {number} speed
     */
    scrollToBottom(speed?: number): void
    {
        speed = speed || 400;
        if ( this.directiveScroll )
        {
            this.directiveScroll.update();

            setTimeout(() => {
                this.directiveScroll.scrollToBottom(0, speed);
            });
        }
    }

    /**
     * Reply
     */
    reply(): void
    {
        // Message
        const message = {
            who    : this.user.id,
            message: this.replyForm.form.value.message,
            time   : new Date().toISOString()
        };

        // Add the message to the chat
        this.dialog.push(message);

        // Update the server
        this._chatService.updateDialog(this.selectedChat.chatId, this.dialog).then(response => {
            this.readyToReply();
        });
    }

    /**
     * Send offer message
     */

    sendOfferMessage(offerDetail): void
    {
        // Message
        const message = {
            who    : this.user.id,
            // tslint:disable-next-line:max-line-length
            message: `Sent Offer \n\n-- Offer Details --\n Seller : Andrey Vasilev \n Buyer : ${offerDetail.name} \n Price : ${offerDetail.price} \n Quantity : ${offerDetail.quantity}`,
            time   : new Date().toISOString()
        };

        // Add the message to the chat
        this.dialog.push(message);

        // Update the server
        this._chatService.updateDialog(this.selectedChat.chatId, this.dialog).then(response => {
            this.readyToReply();
        });
    }

    /**
     * Send Offer
     */

    sendOffer(): void 
    {
        this.dialogRef = this._matDialog.open(ContactsContactFormDialogComponent, {
            panelClass: 'contact-form-dialog',
            data      : {
                contactUser: this.contact,
                action: 'new'
            }
        });

        this.dialogRef.afterClosed()
            .subscribe((response: FormGroup) => {
                if ( !response )
                {
                    return;
                }

                console.log('Response = ', response.getRawValue());
                this.sendOfferMessage(response.getRawValue());
            });
    }

    /**
     * Accept Offer
     */

    acceptOffer(): void 
    {
        this.confirmDialogRef = this._matDialog.open(VeradoConfirmDialogComponent, {
            disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Do you want to accept this offer?';

        this.confirmDialogRef.afterClosed().subscribe(result => {
            if ( result )
            {
                this._matSnackBar.open('Accepted Offer', 'OK', {
                    verticalPosition: 'top',
                    duration        : 2000
                });
            }
            else {
                this._matSnackBar.open('Rejected Offer', 'OK', {
                    verticalPosition: 'top',
                    duration        : 2000
                });
            }
            this.confirmDialogRef = null;
        });
    }
}
