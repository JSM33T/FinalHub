import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import * as signalR from '@microsoft/signalr';

@Component({
  selector: 'app-online-users',
  templateUrl: './online-users.component.html',
  styleUrl: './online-users.component.css'
})
export class OnlineUsersComponent implements OnInit {
  private hubConnection!: signalR.HubConnection;
  onlineUsers: string[] = [];
  baseUrl: string = 'https://node-signal.onrender.com/?meeting=';
  userName: string = '';
  isLoggedIn: boolean = false;
  showConfirmModal: boolean = false;
  fromUser: string = '';

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      //.withUrl('https://jassi.me/videoChatHub')
      .withUrl('https://revalposapilocal.revalweb.com/VideoChathub')
      .build();

    this.setupSignalRHandlers();

    this.hubConnection
      .start()
      .then(() => console.log('SignalR connection established.'))
      .catch(err => console.error('Error while starting connection:', err));
  }

  private setupSignalRHandlers(): void {
    this.hubConnection.on('OnlineUsersList', (users: string[]) => {
      this.onlineUsers = users;
    });

    this.hubConnection.on('ReceiveConnectionRequest', (fromUser: string) => {
      this.fromUser = fromUser;
      this.showConfirmModal = true;
    });

    this.hubConnection.on('CallAccepted', (otherUser: string) => {
      console.log(`Call accepted with ${otherUser}`);
      const roomName = this.createRoomName(this.userName, otherUser);
      window.location.href = this.baseUrl + roomName;
    });

    this.hubConnection.on('CallRejected', (otherUser: string) => {
      console.log(`Call rejected by ${otherUser}`);
      alert(`${otherUser} rejected your call`);
    });
  }

  private createRoomName(user1: string, user2: string): string {
    // Sort usernames alphabetically to ensure same room name regardless of who initiates
    const sortedUsers = [user1, user2].sort();
    return `${sortedUsers[0]}_${sortedUsers[1]}`;
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
    }
  }

  acceptConnection(): void {
    this.showConfirmModal = false;
    
    this.hubConnection.invoke('AcceptConnectionRequest', this.fromUser, this.userName)
      .catch(err => console.error('Error while accepting connection:', err));
  }

  rejectConnection(): void {
    this.showConfirmModal = false;
    
    this.hubConnection.invoke('RejectConnectionRequest', this.fromUser, this.userName)
      .catch(err => console.error('Error while rejecting connection:', err));
  }
}