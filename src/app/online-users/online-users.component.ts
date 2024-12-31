
// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { Router } from '@angular/router';
// import * as signalR from '@microsoft/signalr';

// @Component({
//   selector: 'app-online-users',
//   templateUrl: './online-users.component.html',
//   styleUrl: './online-users.component.css'
// })
// export class OnlineUsersComponent implements OnInit, OnDestroy {
//   private hubConnection!: signalR.HubConnection;
//   onlineUsers: string[] = [];
//   meetingLink: string = `https://node-signal.onrender.com/?meeting=1111`;
//   userName: string = '';
//   isLoggedIn: boolean = false;

//   showConfirmModal: boolean = false;  // Flag to control modal visibility
//   fromUser: string = '';              // Store the user who sent the request

//   constructor(private router: Router) { } // Inject Router

//   ngOnInit(): void {
//     // Initialize the SignalR connection
//     this.hubConnection = new signalR.HubConnectionBuilder()
//       .withUrl('https://localhost:7037/finalHub')
//       .build();

//     // Register to receive the online users list
//     this.hubConnection.on('OnlineUsersList', (users: string[]) => {
//       this.onlineUsers = users;
//     });

//     // Start the connection
//     this.hubConnection
//       .start()
//       .then(() => console.log('SignalR connection established.'))
//       .catch(err => console.error('Error while starting connection:', err));

//     this.hubConnection.on('ReceiveConnectionRequest', (fromUser: string) => {
//       // Show the confirmation modal when a connection request is received
//       this.fromUser = fromUser;
//       this.showConfirmModal = true;
//     });
//   }

//   login(): void {
//     if (this.userName.trim()) {
//       this.hubConnection.invoke('AddUser', this.userName)
//         .then(() => {
//           this.isLoggedIn = true;
//         })
//         .catch(err => console.error('Error while registering user:', err));
//     }
//   }

//   ngOnDestroy(): void {
//     // Stop the connection when the component is destroyed
//     if (this.hubConnection) {
//       this.hubConnection.stop()
//         .then(() => console.log('SignalR connection stopped.'))
//         .catch(err => console.error('Error while stopping connection:', err));
//     }
//   }

//   initiateConnectionRequest(targetUser: string): void {
//     if (this.isLoggedIn) {
//       this.hubConnection.invoke('InitiateConnectionRequest', this.userName, targetUser)
//         .catch(err => console.error('Error initiating connection request:', err));

//       window.location.href = this.meetingLink;
//     }
//   }

//   acceptConnection(): void {
//     this.showConfirmModal = false;

//     // Notify the other party that the connection request is accepted
//     this.hubConnection.invoke('AcceptConnectionRequest', this.userName, this.fromUser)
//       .then(() => {
//         // Redirect to the meeting link upon acceptance
//         window.location.href = this.meetingLink;
//       })
//       .catch(err => console.error('Error while notifying other party:', err));
//   }

//   rejectConnection(): void {
//     this.showConfirmModal = false;
//     // Optionally, notify the user or handle rejection logic
//     alert('Connection request rejected');
//   }
// }


import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import * as signalR from '@microsoft/signalr';

@Component({
  selector: 'app-online-users',
  templateUrl: './online-users.component.html',
  styleUrl: './online-users.component.css'
})
export class OnlineUsersComponent implements OnInit, OnDestroy {
  private hubConnection!: signalR.HubConnection;
  onlineUsers: string[] = [];
  meetingLink: string = `https://node-signal.onrender.com/?meeting=1111`;
  userName: string = '';
  isLoggedIn: boolean = false;
  showConfirmModal: boolean = false;
  fromUser: string = '';

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7037/finalHub')
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
      window.location.href = this.meetingLink;
    });

    this.hubConnection.on('CallRejected', (otherUser: string) => {
      console.log(`Call rejected by ${otherUser}`);
      alert(`${otherUser} rejected your call`);
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