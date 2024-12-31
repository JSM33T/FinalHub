
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import * as signalR from '@microsoft/signalr';

@Component({
  selector: 'app-online-users',
  template: `
    <div>
      <div *ngIf="!isLoggedIn">
        <h2>Login</h2>
        <input [(ngModel)]="userName" placeholder="Enter your username" />
        <button (click)="login()">Login</button>
      </div>

      <div *ngIf="isLoggedIn">
        <h2>Online Users</h2>
        <ul>
          <li *ngFor="let user of onlineUsers">
            {{ user }}
            <button (click)="initiateConnectionRequest(user)" *ngIf="user !== userName">Connect</button>
          </li>
        </ul>
      </div>

      <!-- Confirmation Modal -->
      <div class="modal" *ngIf="showConfirmModal">
        <div class="modal-content">
          <h3>Connection request received from {{ fromUser }}</h3>
          <p>Do you want to join the meeting?</p>
          <button (click)="acceptConnection()">Accept</button>
          <button (click)="rejectConnection()">Reject</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    h2 {
      font-size: 1.5em;
      margin-bottom: 10px;
    }
    ul {
      list-style-type: none;
      padding: 0;
    }
    li {
      margin: 5px 0;
      font-size: 1.2em;
    }
    input {
      padding: 5px;
      margin-right: 10px;
      font-size: 1em;
    }
    button {
      padding: 5px 10px;
      font-size: 1em;
    }

    /* Modal styles */
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .modal-content {
      background: white;
      padding: 20px;
      border-radius: 5px;
      text-align: center;
    }

    .modal button {
      margin: 10px;
    }
  `]
})
export class OnlineUsersComponent implements OnInit, OnDestroy {
  private hubConnection!: signalR.HubConnection;
  onlineUsers: string[] = [];
  meetingLink: string = `https://node-signal.onrender.com/?meeting=1111`;
  userName: string = '';
  isLoggedIn: boolean = false;

  showConfirmModal: boolean = false;  // Flag to control modal visibility
  fromUser: string = '';              // Store the user who sent the request

  constructor(private router: Router) {} // Inject Router

  ngOnInit(): void {
    // Initialize the SignalR connection
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7037/finalHub')
      .build();

    // Register to receive the online users list
    this.hubConnection.on('OnlineUsersList', (users: string[]) => {
      this.onlineUsers = users;
    });

    // Start the connection
    this.hubConnection
      .start()
      .then(() => console.log('SignalR connection established.'))
      .catch(err => console.error('Error while starting connection:', err));

    this.hubConnection.on('ReceiveConnectionRequest', (fromUser: string) => {
      // Show the confirmation modal when a connection request is received
      this.fromUser = fromUser;
      this.showConfirmModal = true;
    });
  }

  login(): void {
    if (this.userName.trim()) {
      this.hubConnection.invoke('AddUser', this.userName)
        .then(() => {
          this.isLoggedIn = true;
        })
        .catch(err => console.error('Error while registering user:', err));
    }
  }

  ngOnDestroy(): void {
    // Stop the connection when the component is destroyed
    if (this.hubConnection) {
      this.hubConnection.stop()
        .then(() => console.log('SignalR connection stopped.'))
        .catch(err => console.error('Error while stopping connection:', err));
    }
  }

  initiateConnectionRequest(targetUser: string): void {
    if (this.isLoggedIn) {
      this.hubConnection.invoke('InitiateConnectionRequest', this.userName, targetUser)
        .catch(err => console.error('Error initiating connection request:', err));

        window.location.href = this.meetingLink;
    }
  }

  acceptConnection(): void {
    this.showConfirmModal = false;
    
    // Notify the other party that the connection request is accepted
    this.hubConnection.invoke('AcceptConnectionRequest', this.userName, this.fromUser)
      .then(() => {
        // Redirect to the meeting link upon acceptance
        window.location.href = this.meetingLink;
      })
      .catch(err => console.error('Error while notifying other party:', err));
  }

  rejectConnection(): void {
    this.showConfirmModal = false;
    // Optionally, notify the user or handle rejection logic
    alert('Connection request rejected');
  }
}