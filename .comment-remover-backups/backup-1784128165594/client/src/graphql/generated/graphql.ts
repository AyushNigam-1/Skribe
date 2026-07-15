import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Author = {
  __typename?: 'Author';
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type Collaborator = {
  __typename?: 'Collaborator';
  role: Scalars['String']['output'];
  status: Scalars['String']['output'];
  user: User;
};

export type Comment = {
  __typename?: 'Comment';
  author: Author;
  createdAt: Scalars['String']['output'];
  text: Scalars['String']['output'];
};

export type CommentInput = {
  createdAt: Scalars['String']['input'];
  text: Scalars['String']['input'];
};

export type Contributor = {
  __typename?: 'Contributor';
  details: ContributorDetails;
  userId: Scalars['ID']['output'];
};

export type ContributorDetails = {
  __typename?: 'ContributorDetails';
  name: Scalars['String']['output'];
  paragraphs: Array<Paragraph>;
};

export type ExportedDocument = {
  __typename?: 'ExportedDocument';
  content: Scalars['String']['output'];
  contentType: Scalars['String']['output'];
  filename: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  acceptInvitation: Script;
  addCollaborator?: Maybe<Script>;
  addComment: Paragraph;
  approveParagraph: MutationResponse;
  createScript: Script;
  declineInvitation: Script;
  deleteNotification?: Maybe<Scalars['Boolean']['output']>;
  deleteParagraph: MutationResponse;
  deleteScript: MutationResponse;
  dislikeParagraph: MutationResponse;
  dislikeScript: MutationResponse;
  editParagraph: Paragraph;
  likeParagraph: MutationResponse;
  likeProfile: MutationResponse;
  likeScript: MutationResponse;
  login?: Maybe<User>;
  logout: Scalars['Boolean']['output'];
  markAllNotificationsRead?: Maybe<Scalars['Boolean']['output']>;
  markAsFavourite: MutationResponse;
  markAsInterested: MutationResponse;
  markAsNotInterested: MutationResponse;
  refreshToken: RefreshTokenResponse;
  register?: Maybe<User>;
  rejectParagraph: MutationResponse;
  removeAllCollaborators?: Maybe<Script>;
  removeAllParagraphs?: Maybe<Script>;
  removeCollaborator: Script;
  submitParagraph: Paragraph;
  toggleBookmark: MutationResponse;
  updateCollaboratorRole: Script;
  updateScript: Script;
  updateUserProfileField: User;
  viewProfile: MutationResponse;
};


export type MutationAcceptInvitationArgs = {
  scriptId: Scalars['ID']['input'];
};


export type MutationAddCollaboratorArgs = {
  identifier: Scalars['String']['input'];
  role: Scalars['String']['input'];
  scriptId: Scalars['ID']['input'];
};


export type MutationAddCommentArgs = {
  paragraphId: Scalars['ID']['input'];
  text: Scalars['String']['input'];
};


export type MutationApproveParagraphArgs = {
  paragraphId: Scalars['ID']['input'];
};


export type MutationCreateScriptArgs = {
  description: Scalars['String']['input'];
  genres: Array<Scalars['String']['input']>;
  languages: Array<Scalars['String']['input']>;
  title: Scalars['String']['input'];
  visibility: Scalars['String']['input'];
};


export type MutationDeclineInvitationArgs = {
  scriptId: Scalars['ID']['input'];
};


export type MutationDeleteNotificationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteParagraphArgs = {
  paragraphId: Scalars['ID']['input'];
};


export type MutationDeleteScriptArgs = {
  scriptId: Scalars['ID']['input'];
};


export type MutationDislikeParagraphArgs = {
  paragraphId: Scalars['ID']['input'];
};


export type MutationDislikeScriptArgs = {
  scriptId: Scalars['ID']['input'];
};


export type MutationEditParagraphArgs = {
  paragraphId: Scalars['ID']['input'];
  text: Scalars['String']['input'];
};


export type MutationLikeParagraphArgs = {
  paragraphId: Scalars['ID']['input'];
};


export type MutationLikeProfileArgs = {
  profileId: Scalars['ID']['input'];
};


export type MutationLikeScriptArgs = {
  scriptId: Scalars['ID']['input'];
};


export type MutationLoginArgs = {
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationMarkAsFavouriteArgs = {
  scriptId: Scalars['ID']['input'];
};


export type MutationMarkAsInterestedArgs = {
  scriptId: Scalars['ID']['input'];
};


export type MutationMarkAsNotInterestedArgs = {
  scriptId: Scalars['ID']['input'];
};


export type MutationRegisterArgs = {
  email?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationRejectParagraphArgs = {
  paragraphId: Scalars['ID']['input'];
};


export type MutationRemoveAllCollaboratorsArgs = {
  scriptId: Scalars['ID']['input'];
};


export type MutationRemoveAllParagraphsArgs = {
  scriptId: Scalars['ID']['input'];
};


export type MutationRemoveCollaboratorArgs = {
  scriptId: Scalars['ID']['input'];
  targetUserId: Scalars['ID']['input'];
};


export type MutationSubmitParagraphArgs = {
  scriptId: Scalars['ID']['input'];
  text: Scalars['String']['input'];
};


export type MutationToggleBookmarkArgs = {
  scriptId: Scalars['ID']['input'];
};


export type MutationUpdateCollaboratorRoleArgs = {
  role: Role;
  scriptId: Scalars['ID']['input'];
  targetUserId: Scalars['ID']['input'];
};


export type MutationUpdateScriptArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  genres?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  languages?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  scriptId: Scalars['ID']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
  visibility?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateUserProfileFieldArgs = {
  key: Scalars['String']['input'];
  value: Scalars['String']['input'];
};


export type MutationViewProfileArgs = {
  profileId: Scalars['ID']['input'];
};

export type MutationResponse = {
  __typename?: 'MutationResponse';
  status: Scalars['Boolean']['output'];
};

export type Notification = {
  __typename?: 'Notification';
  createdAt: Scalars['String']['output'];
  draftTitle?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isRead: Scalars['Boolean']['output'];
  link?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  recipient: User;
  sender?: Maybe<User>;
  type: Scalars['String']['output'];
};

export type Paragraph = {
  __typename?: 'Paragraph';
  author: Author;
  comments: Array<Comment>;
  createdAt: Scalars['String']['output'];
  dislikes: Array<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  likes: Array<Scalars['ID']['output']>;
  script: Script;
  status: Scalars['String']['output'];
  text: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  exportDocument: ExportedDocument;
  getAllScripts: Array<Script>;
  getCombinedText: Scalars['String']['output'];
  getFilteredRequests?: Maybe<Array<Maybe<Paragraph>>>;
  getNotifications: Array<Notification>;
  getParagraphById?: Maybe<Paragraph>;
  getPendingParagraphs: Array<Paragraph>;
  getScriptById?: Maybe<Script>;
  getScriptContributors: ScriptContributors;
  getScriptsByGenres: Array<Script>;
  getUserContributions: Array<UserContribution>;
  getUserContributionsByScript: Array<Paragraph>;
  getUserFavourites: Array<Script>;
  getUserProfile: User;
  getUserScripts: Array<Script>;
  searchUsers?: Maybe<Array<Maybe<User>>>;
};


export type QueryExportDocumentArgs = {
  format: Scalars['String']['input'];
  scriptId: Scalars['ID']['input'];
};


export type QueryGetCombinedTextArgs = {
  scriptId: Scalars['ID']['input'];
};


export type QueryGetFilteredRequestsArgs = {
  scriptId: Scalars['ID']['input'];
  status?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryGetNotificationsArgs = {
  userId: Scalars['ID']['input'];
};


export type QueryGetParagraphByIdArgs = {
  paragraphId: Scalars['ID']['input'];
};


export type QueryGetPendingParagraphsArgs = {
  scriptId: Scalars['ID']['input'];
};


export type QueryGetScriptByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetScriptContributorsArgs = {
  scriptId: Scalars['ID']['input'];
};


export type QueryGetScriptsByGenresArgs = {
  genres: Array<Scalars['String']['input']>;
};


export type QueryGetUserContributionsArgs = {
  userId: Scalars['ID']['input'];
};


export type QueryGetUserContributionsByScriptArgs = {
  scriptId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type QueryGetUserFavouritesArgs = {
  userId: Scalars['ID']['input'];
};


export type QueryGetUserProfileArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetUserScriptsArgs = {
  userId: Scalars['ID']['input'];
};


export type QuerySearchUsersArgs = {
  query: Scalars['String']['input'];
};

export type RefreshTokenResponse = {
  __typename?: 'RefreshTokenResponse';
  token: Scalars['String']['output'];
};

export enum Role {
  Contributor = 'CONTRIBUTOR',
  Editor = 'EDITOR',
  Owner = 'OWNER',
  Viewer = 'VIEWER'
}

export type Script = {
  __typename?: 'Script';
  author: Author;
  collaborators?: Maybe<Array<Collaborator>>;
  combinedText?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  description: Scalars['String']['output'];
  dislikes: Array<Scalars['ID']['output']>;
  genres: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  languages: Array<Scalars['String']['output']>;
  likes: Array<Scalars['ID']['output']>;
  paragraphs: Array<Paragraph>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};

export type ScriptContributors = {
  __typename?: 'ScriptContributors';
  contributors: Array<Contributor>;
};

export type Subscription = {
  __typename?: 'Subscription';
  notificationAdded: Notification;
};


export type SubscriptionNotificationAddedArgs = {
  userId: Scalars['ID']['input'];
};

export type User = {
  __typename?: 'User';
  bio?: Maybe<Scalars['String']['output']>;
  contibutions?: Maybe<Array<Maybe<Scalars['ID']['output']>>>;
  email: Scalars['String']['output'];
  favourites?: Maybe<Array<Maybe<Scalars['ID']['output']>>>;
  followers?: Maybe<Array<Maybe<Scalars['ID']['output']>>>;
  follows?: Maybe<Array<Maybe<Scalars['ID']['output']>>>;
  id?: Maybe<Scalars['ID']['output']>;
  image?: Maybe<Scalars['String']['output']>;
  interests?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  languages?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  likes?: Maybe<Array<Maybe<Scalars['ID']['output']>>>;
  name: Scalars['String']['output'];
  scripts?: Maybe<Array<Maybe<Scalars['ID']['output']>>>;
  token: Scalars['String']['output'];
  username?: Maybe<Scalars['String']['output']>;
  views?: Maybe<Array<Maybe<Scalars['ID']['output']>>>;
};

export type UserContribution = {
  __typename?: 'UserContribution';
  comments: Array<Comment>;
  createdAt: Scalars['String']['output'];
  dislikes: Array<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  likes: Array<Scalars['ID']['output']>;
  script: Script;
  status: Scalars['String']['output'];
  text: Scalars['String']['output'];
};

export type MarkAllNotificationsReadMutationVariables = Exact<{ [key: string]: never; }>;


export type MarkAllNotificationsReadMutation = { __typename?: 'Mutation', markAllNotificationsRead?: boolean | null };

export type DeleteNotificationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteNotificationMutation = { __typename?: 'Mutation', deleteNotification?: boolean | null };

export type EditParagraphMutationVariables = Exact<{
  paragraphId: Scalars['ID']['input'];
  text: Scalars['String']['input'];
}>;


export type EditParagraphMutation = { __typename?: 'Mutation', editParagraph: { __typename?: 'Paragraph', id: string, text: string, createdAt: string, author: { __typename?: 'Author', id: string, name: string } } };

export type DeleteParagraphMutationVariables = Exact<{
  paragraphId: Scalars['ID']['input'];
}>;


export type DeleteParagraphMutation = { __typename?: 'Mutation', deleteParagraph: { __typename?: 'MutationResponse', status: boolean } };

export type LikeParagraphMutationVariables = Exact<{
  paragraphId: Scalars['ID']['input'];
}>;


export type LikeParagraphMutation = { __typename?: 'Mutation', likeParagraph: { __typename?: 'MutationResponse', status: boolean } };

export type DislikeParagraphMutationVariables = Exact<{
  paragraphId: Scalars['ID']['input'];
}>;


export type DislikeParagraphMutation = { __typename?: 'Mutation', dislikeParagraph: { __typename?: 'MutationResponse', status: boolean } };

export type AddCommentMutationVariables = Exact<{
  paragraphId: Scalars['ID']['input'];
  text: Scalars['String']['input'];
}>;


export type AddCommentMutation = { __typename?: 'Mutation', addComment: { __typename?: 'Paragraph', id: string, comments: Array<{ __typename?: 'Comment', text: string, createdAt: string, author: { __typename?: 'Author', id: string, name: string } }> } };

export type CreateScriptMutationVariables = Exact<{
  title: Scalars['String']['input'];
  visibility: Scalars['String']['input'];
  languages: Array<Scalars['String']['input']> | Scalars['String']['input'];
  genres: Array<Scalars['String']['input']> | Scalars['String']['input'];
  description: Scalars['String']['input'];
}>;


export type CreateScriptMutation = { __typename?: 'Mutation', createScript: { __typename?: 'Script', id: string, title: string, visibility: string, languages: Array<string>, genres: Array<string>, description: string, author: { __typename?: 'Author', name: string } } };

export type SubmitParagraphMutationVariables = Exact<{
  scriptId: Scalars['ID']['input'];
  text: Scalars['String']['input'];
}>;


export type SubmitParagraphMutation = { __typename?: 'Mutation', submitParagraph: { __typename?: 'Paragraph', id: string, status: string, text: string, createdAt: string } };

export type ApproveParagraphMutationVariables = Exact<{
  paragraphId: Scalars['ID']['input'];
}>;


export type ApproveParagraphMutation = { __typename?: 'Mutation', approveParagraph: { __typename?: 'MutationResponse', status: boolean } };

export type RejectParagraphMutationVariables = Exact<{
  paragraphId: Scalars['ID']['input'];
}>;


export type RejectParagraphMutation = { __typename?: 'Mutation', rejectParagraph: { __typename?: 'MutationResponse', status: boolean } };

export type ToggleBookmarkMutationVariables = Exact<{
  scriptId: Scalars['ID']['input'];
}>;


export type ToggleBookmarkMutation = { __typename?: 'Mutation', markAsFavourite: { __typename?: 'MutationResponse', status: boolean } };

export type DeleteScriptMutationVariables = Exact<{
  scriptId: Scalars['ID']['input'];
}>;


export type DeleteScriptMutation = { __typename?: 'Mutation', deleteScript: { __typename?: 'MutationResponse', status: boolean } };

export type LikeScriptMutationVariables = Exact<{
  scriptId: Scalars['ID']['input'];
}>;


export type LikeScriptMutation = { __typename?: 'Mutation', likeScript: { __typename?: 'MutationResponse', status: boolean } };

export type DislikeScriptMutationVariables = Exact<{
  scriptId: Scalars['ID']['input'];
}>;


export type DislikeScriptMutation = { __typename?: 'Mutation', dislikeScript: { __typename?: 'MutationResponse', status: boolean } };

export type AddCollaboratorMutationVariables = Exact<{
  scriptId: Scalars['ID']['input'];
  identifier: Scalars['String']['input'];
  role: Scalars['String']['input'];
}>;


export type AddCollaboratorMutation = { __typename?: 'Mutation', addCollaborator?: { __typename?: 'Script', id: string, collaborators?: Array<{ __typename?: 'Collaborator', role: string, user: { __typename?: 'User', id?: string | null, name: string } }> | null } | null };

export type RemoveCollaboratorMutationVariables = Exact<{
  scriptId: Scalars['ID']['input'];
  targetUserId: Scalars['ID']['input'];
}>;


export type RemoveCollaboratorMutation = { __typename?: 'Mutation', removeCollaborator: { __typename?: 'Script', id: string, collaborators?: Array<{ __typename?: 'Collaborator', role: string, user: { __typename?: 'User', id?: string | null, name: string } }> | null } };

export type UpdateCollaboratorRoleMutationVariables = Exact<{
  scriptId: Scalars['ID']['input'];
  targetUserId: Scalars['ID']['input'];
  role: Role;
}>;


export type UpdateCollaboratorRoleMutation = { __typename?: 'Mutation', updateCollaboratorRole: { __typename?: 'Script', id: string, collaborators?: Array<{ __typename?: 'Collaborator', role: string, user: { __typename?: 'User', id?: string | null, name: string } }> | null } };

export type UpdateScriptMutationVariables = Exact<{
  scriptId: Scalars['ID']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  visibility?: InputMaybe<Scalars['String']['input']>;
  genres?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>>;
  languages?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>>;
}>;


export type UpdateScriptMutation = { __typename?: 'Mutation', updateScript: { __typename?: 'Script', id: string, title: string, description: string, visibility: string, genres: Array<string>, languages: Array<string> } };

export type RemoveAllParagraphsMutationVariables = Exact<{
  scriptId: Scalars['ID']['input'];
}>;


export type RemoveAllParagraphsMutation = { __typename?: 'Mutation', removeAllParagraphs?: { __typename?: 'Script', id: string, paragraphs: Array<{ __typename?: 'Paragraph', id: string }> } | null };

export type RemoveAllCollaboratorsMutationVariables = Exact<{
  scriptId: Scalars['ID']['input'];
}>;


export type RemoveAllCollaboratorsMutation = { __typename?: 'Mutation', removeAllCollaborators?: { __typename?: 'Script', id: string, collaborators?: Array<{ __typename?: 'Collaborator', role: string, user: { __typename?: 'User', id?: string | null, name: string } }> | null } | null };

export type RegisterMutationVariables = Exact<{
  name: Scalars['String']['input'];
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type RegisterMutation = { __typename?: 'Mutation', register?: { __typename?: 'User', id?: string | null, name: string, email: string, token: string } | null };

export type LoginMutationVariables = Exact<{
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type LoginMutation = { __typename?: 'Mutation', login?: { __typename?: 'User', id?: string | null, name: string, email: string, token: string } | null };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { __typename?: 'Mutation', logout: boolean };

export type UpdateUserProfileFieldMutationVariables = Exact<{
  key: Scalars['String']['input'];
  value: Scalars['String']['input'];
}>;


export type UpdateUserProfileFieldMutation = { __typename?: 'Mutation', updateUserProfileField: { __typename?: 'User', id?: string | null, name: string, bio?: string | null, languages?: Array<string | null> | null, interests?: Array<string | null> | null } };

export type LikeProfileMutationVariables = Exact<{
  profileId: Scalars['ID']['input'];
}>;


export type LikeProfileMutation = { __typename?: 'Mutation', likeProfile: { __typename?: 'MutationResponse', status: boolean } };

export type ViewProfileMutationVariables = Exact<{
  profileId: Scalars['ID']['input'];
}>;


export type ViewProfileMutation = { __typename?: 'Mutation', viewProfile: { __typename?: 'MutationResponse', status: boolean } };

export type AcceptInvitationMutationVariables = Exact<{
  scriptId: Scalars['ID']['input'];
}>;


export type AcceptInvitationMutation = { __typename?: 'Mutation', acceptInvitation: { __typename?: 'Script', id: string } };

export type DeclineInvitationMutationVariables = Exact<{
  scriptId: Scalars['ID']['input'];
}>;


export type DeclineInvitationMutation = { __typename?: 'Mutation', declineInvitation: { __typename?: 'Script', id: string } };

export type GetNotificationsQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type GetNotificationsQuery = { __typename?: 'Query', getNotifications: Array<{ __typename?: 'Notification', id: string, type: string, message: string, draftTitle?: string | null, link?: string | null, isRead: boolean, createdAt: string, sender?: { __typename?: 'User', id?: string | null, name: string } | null }> };

export type OnNotificationAddedSubscriptionVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type OnNotificationAddedSubscription = { __typename?: 'Subscription', notificationAdded: { __typename?: 'Notification', id: string, type: string, message: string, draftTitle?: string | null, link?: string | null, isRead: boolean, createdAt: string, sender?: { __typename?: 'User', id?: string | null, name: string } | null } };

export type GetParagraphByIdQueryVariables = Exact<{
  paragraphId: Scalars['ID']['input'];
}>;


export type GetParagraphByIdQuery = { __typename?: 'Query', getParagraphById?: { __typename?: 'Paragraph', id: string, text: string, status: string, createdAt: string, likes: Array<string>, dislikes: Array<string>, script: { __typename?: 'Script', id: string, author: { __typename?: 'Author', id: string }, collaborators?: Array<{ __typename?: 'Collaborator', role: string, user: { __typename?: 'User', id?: string | null } }> | null }, author: { __typename?: 'Author', id: string, name: string }, comments: Array<{ __typename?: 'Comment', text: string, createdAt: string, author: { __typename?: 'Author', id: string, name: string } }> } | null };

export type GetFilteredRequestsQueryVariables = Exact<{
  scriptId: Scalars['ID']['input'];
  userId?: InputMaybe<Scalars['ID']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetFilteredRequestsQuery = { __typename?: 'Query', getFilteredRequests?: Array<{ __typename?: 'Paragraph', id: string, text: string, status: string, createdAt: string, likes: Array<string>, dislikes: Array<string>, author: { __typename?: 'Author', id: string, name: string }, comments: Array<{ __typename?: 'Comment', text: string, createdAt: string, author: { __typename?: 'Author', name: string } }> } | null> | null };

export type GetPendingParagraphsQueryVariables = Exact<{
  scriptId: Scalars['ID']['input'];
}>;


export type GetPendingParagraphsQuery = { __typename?: 'Query', getPendingParagraphs: Array<{ __typename?: 'Paragraph', id: string, text: string, createdAt: string, status: string, author: { __typename?: 'Author', name: string } }> };

export type ExportDocumentQueryVariables = Exact<{
  scriptId: Scalars['ID']['input'];
  format: Scalars['String']['input'];
}>;


export type ExportDocumentQuery = { __typename?: 'Query', exportDocument: { __typename?: 'ExportedDocument', filename: string, content: string, contentType: string } };

export type GetScriptByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetScriptByIdQuery = { __typename?: 'Query', getScriptById?: { __typename?: 'Script', id: string, title: string, visibility: string, languages: Array<string>, genres: Array<string>, description: string, createdAt: string, combinedText?: string | null, likes: Array<string>, dislikes: Array<string>, author: { __typename?: 'Author', id: string, name: string }, collaborators?: Array<{ __typename?: 'Collaborator', role: string, user: { __typename?: 'User', id?: string | null, name: string } }> | null, paragraphs: Array<{ __typename?: 'Paragraph', id: string, text: string, status: string, likes: Array<string>, dislikes: Array<string>, createdAt: string, author: { __typename?: 'Author', id: string, name: string }, comments: Array<{ __typename?: 'Comment', text: string, createdAt: string, author: { __typename?: 'Author', id: string, name: string } }> }> } | null };

export type GetScriptsByGenresQueryVariables = Exact<{
  genres: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type GetScriptsByGenresQuery = { __typename?: 'Query', getScriptsByGenres: Array<{ __typename?: 'Script', id: string, title: string, genres: Array<string>, description: string, likes: Array<string>, languages: Array<string>, dislikes: Array<string>, createdAt: string, author: { __typename?: 'Author', name: string } }> };

export type GetScriptContributorsQueryVariables = Exact<{
  scriptId: Scalars['ID']['input'];
}>;


export type GetScriptContributorsQuery = { __typename?: 'Query', getScriptContributors: { __typename?: 'ScriptContributors', contributors: Array<{ __typename?: 'Contributor', userId: string, details: { __typename?: 'ContributorDetails', name: string, paragraphs: Array<{ __typename?: 'Paragraph', id: string, text: string, status: string, createdAt: string, likes: Array<string>, dislikes: Array<string>, author: { __typename?: 'Author', name: string }, comments: Array<{ __typename?: 'Comment', text: string, createdAt: string, author: { __typename?: 'Author', name: string } }> }> } }> } };

export type GetUserContributionsByScriptQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
  scriptId: Scalars['ID']['input'];
}>;


export type GetUserContributionsByScriptQuery = { __typename?: 'Query', getUserContributionsByScript: Array<{ __typename?: 'Paragraph', id: string, text: string, status: string, createdAt: string, likes: Array<string>, dislikes: Array<string>, script: { __typename?: 'Script', id: string, title: string }, author: { __typename?: 'Author', id: string, name: string }, comments: Array<{ __typename?: 'Comment', text: string, createdAt: string, author: { __typename?: 'Author', name: string } }> }> };

export type GetUserProfileQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetUserProfileQuery = { __typename?: 'Query', getUserProfile: { __typename?: 'User', id?: string | null, name: string, username?: string | null, email: string, bio?: string | null, languages?: Array<string | null> | null, favourites?: Array<string | null> | null, likes?: Array<string | null> | null, followers?: Array<string | null> | null, follows?: Array<string | null> | null, views?: Array<string | null> | null } };

export type GetUserScriptsQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type GetUserScriptsQuery = { __typename?: 'Query', getUserScripts: Array<{ __typename?: 'Script', id: string, title: string, visibility: string, description: string, languages: Array<string>, genres: Array<string>, createdAt: string, updatedAt: string, author: { __typename?: 'Author', id: string, name: string } }> };

export type GetUserContributionsQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type GetUserContributionsQuery = { __typename?: 'Query', getUserContributions: Array<{ __typename?: 'UserContribution', id: string, status: string, text: string, likes: Array<string>, dislikes: Array<string>, createdAt: string, script: { __typename?: 'Script', id: string, title: string }, comments: Array<{ __typename?: 'Comment', text: string, createdAt: string, author: { __typename?: 'Author', name: string } }> }> };

export type GetUserFavouritesQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type GetUserFavouritesQuery = { __typename?: 'Query', getUserFavourites: Array<{ __typename?: 'Script', id: string, title: string, visibility: string, description: string, languages: Array<string>, genres: Array<string>, createdAt: string, updatedAt: string, author: { __typename?: 'Author', id: string, name: string } }> };

export type SearchUsersQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type SearchUsersQuery = { __typename?: 'Query', searchUsers?: Array<{ __typename?: 'User', id?: string | null, name: string, username?: string | null } | null> | null };


export const MarkAllNotificationsReadDocument = gql`
    mutation MarkAllNotificationsRead {
  markAllNotificationsRead
}
    `;
export type MarkAllNotificationsReadMutationFn = Apollo.MutationFunction<MarkAllNotificationsReadMutation, MarkAllNotificationsReadMutationVariables>;

/**
 * __useMarkAllNotificationsReadMutation__
 *
 * To run a mutation, you first call `useMarkAllNotificationsReadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useMarkAllNotificationsReadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [markAllNotificationsReadMutation, { data, loading, error }] = useMarkAllNotificationsReadMutation({
 *   variables: {
 *   },
 * });
 */
export function useMarkAllNotificationsReadMutation(baseOptions?: Apollo.MutationHookOptions<MarkAllNotificationsReadMutation, MarkAllNotificationsReadMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<MarkAllNotificationsReadMutation, MarkAllNotificationsReadMutationVariables>(MarkAllNotificationsReadDocument, options);
      }
export type MarkAllNotificationsReadMutationHookResult = ReturnType<typeof useMarkAllNotificationsReadMutation>;
export type MarkAllNotificationsReadMutationResult = Apollo.MutationResult<MarkAllNotificationsReadMutation>;
export type MarkAllNotificationsReadMutationOptions = Apollo.BaseMutationOptions<MarkAllNotificationsReadMutation, MarkAllNotificationsReadMutationVariables>;
export const DeleteNotificationDocument = gql`
    mutation DeleteNotification($id: ID!) {
  deleteNotification(id: $id)
}
    `;
export type DeleteNotificationMutationFn = Apollo.MutationFunction<DeleteNotificationMutation, DeleteNotificationMutationVariables>;

/**
 * __useDeleteNotificationMutation__
 *
 * To run a mutation, you first call `useDeleteNotificationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteNotificationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteNotificationMutation, { data, loading, error }] = useDeleteNotificationMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteNotificationMutation(baseOptions?: Apollo.MutationHookOptions<DeleteNotificationMutation, DeleteNotificationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteNotificationMutation, DeleteNotificationMutationVariables>(DeleteNotificationDocument, options);
      }
export type DeleteNotificationMutationHookResult = ReturnType<typeof useDeleteNotificationMutation>;
export type DeleteNotificationMutationResult = Apollo.MutationResult<DeleteNotificationMutation>;
export type DeleteNotificationMutationOptions = Apollo.BaseMutationOptions<DeleteNotificationMutation, DeleteNotificationMutationVariables>;
export const EditParagraphDocument = gql`
    mutation EditParagraph($paragraphId: ID!, $text: String!) {
  editParagraph(paragraphId: $paragraphId, text: $text) {
    id
    text
    createdAt
    author {
      id
      name
    }
  }
}
    `;
export type EditParagraphMutationFn = Apollo.MutationFunction<EditParagraphMutation, EditParagraphMutationVariables>;

/**
 * __useEditParagraphMutation__
 *
 * To run a mutation, you first call `useEditParagraphMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useEditParagraphMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [editParagraphMutation, { data, loading, error }] = useEditParagraphMutation({
 *   variables: {
 *      paragraphId: // value for 'paragraphId'
 *      text: // value for 'text'
 *   },
 * });
 */
export function useEditParagraphMutation(baseOptions?: Apollo.MutationHookOptions<EditParagraphMutation, EditParagraphMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<EditParagraphMutation, EditParagraphMutationVariables>(EditParagraphDocument, options);
      }
export type EditParagraphMutationHookResult = ReturnType<typeof useEditParagraphMutation>;
export type EditParagraphMutationResult = Apollo.MutationResult<EditParagraphMutation>;
export type EditParagraphMutationOptions = Apollo.BaseMutationOptions<EditParagraphMutation, EditParagraphMutationVariables>;
export const DeleteParagraphDocument = gql`
    mutation DeleteParagraph($paragraphId: ID!) {
  deleteParagraph(paragraphId: $paragraphId) {
    status
  }
}
    `;
export type DeleteParagraphMutationFn = Apollo.MutationFunction<DeleteParagraphMutation, DeleteParagraphMutationVariables>;

/**
 * __useDeleteParagraphMutation__
 *
 * To run a mutation, you first call `useDeleteParagraphMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteParagraphMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteParagraphMutation, { data, loading, error }] = useDeleteParagraphMutation({
 *   variables: {
 *      paragraphId: // value for 'paragraphId'
 *   },
 * });
 */
export function useDeleteParagraphMutation(baseOptions?: Apollo.MutationHookOptions<DeleteParagraphMutation, DeleteParagraphMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteParagraphMutation, DeleteParagraphMutationVariables>(DeleteParagraphDocument, options);
      }
export type DeleteParagraphMutationHookResult = ReturnType<typeof useDeleteParagraphMutation>;
export type DeleteParagraphMutationResult = Apollo.MutationResult<DeleteParagraphMutation>;
export type DeleteParagraphMutationOptions = Apollo.BaseMutationOptions<DeleteParagraphMutation, DeleteParagraphMutationVariables>;
export const LikeParagraphDocument = gql`
    mutation LikeParagraph($paragraphId: ID!) {
  likeParagraph(paragraphId: $paragraphId) {
    status
  }
}
    `;
export type LikeParagraphMutationFn = Apollo.MutationFunction<LikeParagraphMutation, LikeParagraphMutationVariables>;

/**
 * __useLikeParagraphMutation__
 *
 * To run a mutation, you first call `useLikeParagraphMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLikeParagraphMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [likeParagraphMutation, { data, loading, error }] = useLikeParagraphMutation({
 *   variables: {
 *      paragraphId: // value for 'paragraphId'
 *   },
 * });
 */
export function useLikeParagraphMutation(baseOptions?: Apollo.MutationHookOptions<LikeParagraphMutation, LikeParagraphMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LikeParagraphMutation, LikeParagraphMutationVariables>(LikeParagraphDocument, options);
      }
export type LikeParagraphMutationHookResult = ReturnType<typeof useLikeParagraphMutation>;
export type LikeParagraphMutationResult = Apollo.MutationResult<LikeParagraphMutation>;
export type LikeParagraphMutationOptions = Apollo.BaseMutationOptions<LikeParagraphMutation, LikeParagraphMutationVariables>;
export const DislikeParagraphDocument = gql`
    mutation DislikeParagraph($paragraphId: ID!) {
  dislikeParagraph(paragraphId: $paragraphId) {
    status
  }
}
    `;
export type DislikeParagraphMutationFn = Apollo.MutationFunction<DislikeParagraphMutation, DislikeParagraphMutationVariables>;

/**
 * __useDislikeParagraphMutation__
 *
 * To run a mutation, you first call `useDislikeParagraphMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDislikeParagraphMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [dislikeParagraphMutation, { data, loading, error }] = useDislikeParagraphMutation({
 *   variables: {
 *      paragraphId: // value for 'paragraphId'
 *   },
 * });
 */
export function useDislikeParagraphMutation(baseOptions?: Apollo.MutationHookOptions<DislikeParagraphMutation, DislikeParagraphMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DislikeParagraphMutation, DislikeParagraphMutationVariables>(DislikeParagraphDocument, options);
      }
export type DislikeParagraphMutationHookResult = ReturnType<typeof useDislikeParagraphMutation>;
export type DislikeParagraphMutationResult = Apollo.MutationResult<DislikeParagraphMutation>;
export type DislikeParagraphMutationOptions = Apollo.BaseMutationOptions<DislikeParagraphMutation, DislikeParagraphMutationVariables>;
export const AddCommentDocument = gql`
    mutation AddComment($paragraphId: ID!, $text: String!) {
  addComment(paragraphId: $paragraphId, text: $text) {
    id
    comments {
      text
      createdAt
      author {
        id
        name
      }
    }
  }
}
    `;
export type AddCommentMutationFn = Apollo.MutationFunction<AddCommentMutation, AddCommentMutationVariables>;

/**
 * __useAddCommentMutation__
 *
 * To run a mutation, you first call `useAddCommentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddCommentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addCommentMutation, { data, loading, error }] = useAddCommentMutation({
 *   variables: {
 *      paragraphId: // value for 'paragraphId'
 *      text: // value for 'text'
 *   },
 * });
 */
export function useAddCommentMutation(baseOptions?: Apollo.MutationHookOptions<AddCommentMutation, AddCommentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddCommentMutation, AddCommentMutationVariables>(AddCommentDocument, options);
      }
export type AddCommentMutationHookResult = ReturnType<typeof useAddCommentMutation>;
export type AddCommentMutationResult = Apollo.MutationResult<AddCommentMutation>;
export type AddCommentMutationOptions = Apollo.BaseMutationOptions<AddCommentMutation, AddCommentMutationVariables>;
export const CreateScriptDocument = gql`
    mutation CreateScript($title: String!, $visibility: String!, $languages: [String!]!, $genres: [String!]!, $description: String!) {
  createScript(
    title: $title
    visibility: $visibility
    languages: $languages
    genres: $genres
    description: $description
  ) {
    id
    title
    visibility
    languages
    genres
    description
    author {
      name
    }
  }
}
    `;
export type CreateScriptMutationFn = Apollo.MutationFunction<CreateScriptMutation, CreateScriptMutationVariables>;

/**
 * __useCreateScriptMutation__
 *
 * To run a mutation, you first call `useCreateScriptMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateScriptMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createScriptMutation, { data, loading, error }] = useCreateScriptMutation({
 *   variables: {
 *      title: // value for 'title'
 *      visibility: // value for 'visibility'
 *      languages: // value for 'languages'
 *      genres: // value for 'genres'
 *      description: // value for 'description'
 *   },
 * });
 */
export function useCreateScriptMutation(baseOptions?: Apollo.MutationHookOptions<CreateScriptMutation, CreateScriptMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateScriptMutation, CreateScriptMutationVariables>(CreateScriptDocument, options);
      }
export type CreateScriptMutationHookResult = ReturnType<typeof useCreateScriptMutation>;
export type CreateScriptMutationResult = Apollo.MutationResult<CreateScriptMutation>;
export type CreateScriptMutationOptions = Apollo.BaseMutationOptions<CreateScriptMutation, CreateScriptMutationVariables>;
export const SubmitParagraphDocument = gql`
    mutation SubmitParagraph($scriptId: ID!, $text: String!) {
  submitParagraph(scriptId: $scriptId, text: $text) {
    id
    status
    text
    createdAt
  }
}
    `;
export type SubmitParagraphMutationFn = Apollo.MutationFunction<SubmitParagraphMutation, SubmitParagraphMutationVariables>;

/**
 * __useSubmitParagraphMutation__
 *
 * To run a mutation, you first call `useSubmitParagraphMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSubmitParagraphMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [submitParagraphMutation, { data, loading, error }] = useSubmitParagraphMutation({
 *   variables: {
 *      scriptId: // value for 'scriptId'
 *      text: // value for 'text'
 *   },
 * });
 */
export function useSubmitParagraphMutation(baseOptions?: Apollo.MutationHookOptions<SubmitParagraphMutation, SubmitParagraphMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SubmitParagraphMutation, SubmitParagraphMutationVariables>(SubmitParagraphDocument, options);
      }
export type SubmitParagraphMutationHookResult = ReturnType<typeof useSubmitParagraphMutation>;
export type SubmitParagraphMutationResult = Apollo.MutationResult<SubmitParagraphMutation>;
export type SubmitParagraphMutationOptions = Apollo.BaseMutationOptions<SubmitParagraphMutation, SubmitParagraphMutationVariables>;
export const ApproveParagraphDocument = gql`
    mutation ApproveParagraph($paragraphId: ID!) {
  approveParagraph(paragraphId: $paragraphId) {
    status
  }
}
    `;
export type ApproveParagraphMutationFn = Apollo.MutationFunction<ApproveParagraphMutation, ApproveParagraphMutationVariables>;

/**
 * __useApproveParagraphMutation__
 *
 * To run a mutation, you first call `useApproveParagraphMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useApproveParagraphMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [approveParagraphMutation, { data, loading, error }] = useApproveParagraphMutation({
 *   variables: {
 *      paragraphId: // value for 'paragraphId'
 *   },
 * });
 */
export function useApproveParagraphMutation(baseOptions?: Apollo.MutationHookOptions<ApproveParagraphMutation, ApproveParagraphMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ApproveParagraphMutation, ApproveParagraphMutationVariables>(ApproveParagraphDocument, options);
      }
export type ApproveParagraphMutationHookResult = ReturnType<typeof useApproveParagraphMutation>;
export type ApproveParagraphMutationResult = Apollo.MutationResult<ApproveParagraphMutation>;
export type ApproveParagraphMutationOptions = Apollo.BaseMutationOptions<ApproveParagraphMutation, ApproveParagraphMutationVariables>;
export const RejectParagraphDocument = gql`
    mutation RejectParagraph($paragraphId: ID!) {
  rejectParagraph(paragraphId: $paragraphId) {
    status
  }
}
    `;
export type RejectParagraphMutationFn = Apollo.MutationFunction<RejectParagraphMutation, RejectParagraphMutationVariables>;

/**
 * __useRejectParagraphMutation__
 *
 * To run a mutation, you first call `useRejectParagraphMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRejectParagraphMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [rejectParagraphMutation, { data, loading, error }] = useRejectParagraphMutation({
 *   variables: {
 *      paragraphId: // value for 'paragraphId'
 *   },
 * });
 */
export function useRejectParagraphMutation(baseOptions?: Apollo.MutationHookOptions<RejectParagraphMutation, RejectParagraphMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RejectParagraphMutation, RejectParagraphMutationVariables>(RejectParagraphDocument, options);
      }
export type RejectParagraphMutationHookResult = ReturnType<typeof useRejectParagraphMutation>;
export type RejectParagraphMutationResult = Apollo.MutationResult<RejectParagraphMutation>;
export type RejectParagraphMutationOptions = Apollo.BaseMutationOptions<RejectParagraphMutation, RejectParagraphMutationVariables>;
export const ToggleBookmarkDocument = gql`
    mutation ToggleBookmark($scriptId: ID!) {
  markAsFavourite(scriptId: $scriptId) {
    status
  }
}
    `;
export type ToggleBookmarkMutationFn = Apollo.MutationFunction<ToggleBookmarkMutation, ToggleBookmarkMutationVariables>;

/**
 * __useToggleBookmarkMutation__
 *
 * To run a mutation, you first call `useToggleBookmarkMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useToggleBookmarkMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [toggleBookmarkMutation, { data, loading, error }] = useToggleBookmarkMutation({
 *   variables: {
 *      scriptId: // value for 'scriptId'
 *   },
 * });
 */
export function useToggleBookmarkMutation(baseOptions?: Apollo.MutationHookOptions<ToggleBookmarkMutation, ToggleBookmarkMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ToggleBookmarkMutation, ToggleBookmarkMutationVariables>(ToggleBookmarkDocument, options);
      }
export type ToggleBookmarkMutationHookResult = ReturnType<typeof useToggleBookmarkMutation>;
export type ToggleBookmarkMutationResult = Apollo.MutationResult<ToggleBookmarkMutation>;
export type ToggleBookmarkMutationOptions = Apollo.BaseMutationOptions<ToggleBookmarkMutation, ToggleBookmarkMutationVariables>;
export const DeleteScriptDocument = gql`
    mutation DeleteScript($scriptId: ID!) {
  deleteScript(scriptId: $scriptId) {
    status
  }
}
    `;
export type DeleteScriptMutationFn = Apollo.MutationFunction<DeleteScriptMutation, DeleteScriptMutationVariables>;

/**
 * __useDeleteScriptMutation__
 *
 * To run a mutation, you first call `useDeleteScriptMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteScriptMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteScriptMutation, { data, loading, error }] = useDeleteScriptMutation({
 *   variables: {
 *      scriptId: // value for 'scriptId'
 *   },
 * });
 */
export function useDeleteScriptMutation(baseOptions?: Apollo.MutationHookOptions<DeleteScriptMutation, DeleteScriptMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteScriptMutation, DeleteScriptMutationVariables>(DeleteScriptDocument, options);
      }
export type DeleteScriptMutationHookResult = ReturnType<typeof useDeleteScriptMutation>;
export type DeleteScriptMutationResult = Apollo.MutationResult<DeleteScriptMutation>;
export type DeleteScriptMutationOptions = Apollo.BaseMutationOptions<DeleteScriptMutation, DeleteScriptMutationVariables>;
export const LikeScriptDocument = gql`
    mutation LikeScript($scriptId: ID!) {
  likeScript(scriptId: $scriptId) {
    status
  }
}
    `;
export type LikeScriptMutationFn = Apollo.MutationFunction<LikeScriptMutation, LikeScriptMutationVariables>;

/**
 * __useLikeScriptMutation__
 *
 * To run a mutation, you first call `useLikeScriptMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLikeScriptMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [likeScriptMutation, { data, loading, error }] = useLikeScriptMutation({
 *   variables: {
 *      scriptId: // value for 'scriptId'
 *   },
 * });
 */
export function useLikeScriptMutation(baseOptions?: Apollo.MutationHookOptions<LikeScriptMutation, LikeScriptMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LikeScriptMutation, LikeScriptMutationVariables>(LikeScriptDocument, options);
      }
export type LikeScriptMutationHookResult = ReturnType<typeof useLikeScriptMutation>;
export type LikeScriptMutationResult = Apollo.MutationResult<LikeScriptMutation>;
export type LikeScriptMutationOptions = Apollo.BaseMutationOptions<LikeScriptMutation, LikeScriptMutationVariables>;
export const DislikeScriptDocument = gql`
    mutation DislikeScript($scriptId: ID!) {
  dislikeScript(scriptId: $scriptId) {
    status
  }
}
    `;
export type DislikeScriptMutationFn = Apollo.MutationFunction<DislikeScriptMutation, DislikeScriptMutationVariables>;

/**
 * __useDislikeScriptMutation__
 *
 * To run a mutation, you first call `useDislikeScriptMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDislikeScriptMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [dislikeScriptMutation, { data, loading, error }] = useDislikeScriptMutation({
 *   variables: {
 *      scriptId: // value for 'scriptId'
 *   },
 * });
 */
export function useDislikeScriptMutation(baseOptions?: Apollo.MutationHookOptions<DislikeScriptMutation, DislikeScriptMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DislikeScriptMutation, DislikeScriptMutationVariables>(DislikeScriptDocument, options);
      }
export type DislikeScriptMutationHookResult = ReturnType<typeof useDislikeScriptMutation>;
export type DislikeScriptMutationResult = Apollo.MutationResult<DislikeScriptMutation>;
export type DislikeScriptMutationOptions = Apollo.BaseMutationOptions<DislikeScriptMutation, DislikeScriptMutationVariables>;
export const AddCollaboratorDocument = gql`
    mutation AddCollaborator($scriptId: ID!, $identifier: String!, $role: String!) {
  addCollaborator(scriptId: $scriptId, identifier: $identifier, role: $role) {
    id
    collaborators {
      user {
        id
        name
      }
      role
    }
  }
}
    `;
export type AddCollaboratorMutationFn = Apollo.MutationFunction<AddCollaboratorMutation, AddCollaboratorMutationVariables>;

/**
 * __useAddCollaboratorMutation__
 *
 * To run a mutation, you first call `useAddCollaboratorMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddCollaboratorMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addCollaboratorMutation, { data, loading, error }] = useAddCollaboratorMutation({
 *   variables: {
 *      scriptId: // value for 'scriptId'
 *      identifier: // value for 'identifier'
 *      role: // value for 'role'
 *   },
 * });
 */
export function useAddCollaboratorMutation(baseOptions?: Apollo.MutationHookOptions<AddCollaboratorMutation, AddCollaboratorMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddCollaboratorMutation, AddCollaboratorMutationVariables>(AddCollaboratorDocument, options);
      }
export type AddCollaboratorMutationHookResult = ReturnType<typeof useAddCollaboratorMutation>;
export type AddCollaboratorMutationResult = Apollo.MutationResult<AddCollaboratorMutation>;
export type AddCollaboratorMutationOptions = Apollo.BaseMutationOptions<AddCollaboratorMutation, AddCollaboratorMutationVariables>;
export const RemoveCollaboratorDocument = gql`
    mutation RemoveCollaborator($scriptId: ID!, $targetUserId: ID!) {
  removeCollaborator(scriptId: $scriptId, targetUserId: $targetUserId) {
    id
    collaborators {
      user {
        id
        name
      }
      role
    }
  }
}
    `;
export type RemoveCollaboratorMutationFn = Apollo.MutationFunction<RemoveCollaboratorMutation, RemoveCollaboratorMutationVariables>;

/**
 * __useRemoveCollaboratorMutation__
 *
 * To run a mutation, you first call `useRemoveCollaboratorMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveCollaboratorMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeCollaboratorMutation, { data, loading, error }] = useRemoveCollaboratorMutation({
 *   variables: {
 *      scriptId: // value for 'scriptId'
 *      targetUserId: // value for 'targetUserId'
 *   },
 * });
 */
export function useRemoveCollaboratorMutation(baseOptions?: Apollo.MutationHookOptions<RemoveCollaboratorMutation, RemoveCollaboratorMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RemoveCollaboratorMutation, RemoveCollaboratorMutationVariables>(RemoveCollaboratorDocument, options);
      }
export type RemoveCollaboratorMutationHookResult = ReturnType<typeof useRemoveCollaboratorMutation>;
export type RemoveCollaboratorMutationResult = Apollo.MutationResult<RemoveCollaboratorMutation>;
export type RemoveCollaboratorMutationOptions = Apollo.BaseMutationOptions<RemoveCollaboratorMutation, RemoveCollaboratorMutationVariables>;
export const UpdateCollaboratorRoleDocument = gql`
    mutation UpdateCollaboratorRole($scriptId: ID!, $targetUserId: ID!, $role: Role!) {
  updateCollaboratorRole(
    scriptId: $scriptId
    targetUserId: $targetUserId
    role: $role
  ) {
    id
    collaborators {
      user {
        id
        name
      }
      role
    }
  }
}
    `;
export type UpdateCollaboratorRoleMutationFn = Apollo.MutationFunction<UpdateCollaboratorRoleMutation, UpdateCollaboratorRoleMutationVariables>;

/**
 * __useUpdateCollaboratorRoleMutation__
 *
 * To run a mutation, you first call `useUpdateCollaboratorRoleMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateCollaboratorRoleMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateCollaboratorRoleMutation, { data, loading, error }] = useUpdateCollaboratorRoleMutation({
 *   variables: {
 *      scriptId: // value for 'scriptId'
 *      targetUserId: // value for 'targetUserId'
 *      role: // value for 'role'
 *   },
 * });
 */
export function useUpdateCollaboratorRoleMutation(baseOptions?: Apollo.MutationHookOptions<UpdateCollaboratorRoleMutation, UpdateCollaboratorRoleMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateCollaboratorRoleMutation, UpdateCollaboratorRoleMutationVariables>(UpdateCollaboratorRoleDocument, options);
      }
export type UpdateCollaboratorRoleMutationHookResult = ReturnType<typeof useUpdateCollaboratorRoleMutation>;
export type UpdateCollaboratorRoleMutationResult = Apollo.MutationResult<UpdateCollaboratorRoleMutation>;
export type UpdateCollaboratorRoleMutationOptions = Apollo.BaseMutationOptions<UpdateCollaboratorRoleMutation, UpdateCollaboratorRoleMutationVariables>;
export const UpdateScriptDocument = gql`
    mutation UpdateScript($scriptId: ID!, $title: String, $description: String, $visibility: String, $genres: [String], $languages: [String]) {
  updateScript(
    scriptId: $scriptId
    title: $title
    description: $description
    visibility: $visibility
    genres: $genres
    languages: $languages
  ) {
    id
    title
    description
    visibility
    genres
    languages
  }
}
    `;
export type UpdateScriptMutationFn = Apollo.MutationFunction<UpdateScriptMutation, UpdateScriptMutationVariables>;

/**
 * __useUpdateScriptMutation__
 *
 * To run a mutation, you first call `useUpdateScriptMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateScriptMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateScriptMutation, { data, loading, error }] = useUpdateScriptMutation({
 *   variables: {
 *      scriptId: // value for 'scriptId'
 *      title: // value for 'title'
 *      description: // value for 'description'
 *      visibility: // value for 'visibility'
 *      genres: // value for 'genres'
 *      languages: // value for 'languages'
 *   },
 * });
 */
export function useUpdateScriptMutation(baseOptions?: Apollo.MutationHookOptions<UpdateScriptMutation, UpdateScriptMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateScriptMutation, UpdateScriptMutationVariables>(UpdateScriptDocument, options);
      }
export type UpdateScriptMutationHookResult = ReturnType<typeof useUpdateScriptMutation>;
export type UpdateScriptMutationResult = Apollo.MutationResult<UpdateScriptMutation>;
export type UpdateScriptMutationOptions = Apollo.BaseMutationOptions<UpdateScriptMutation, UpdateScriptMutationVariables>;
export const RemoveAllParagraphsDocument = gql`
    mutation RemoveAllParagraphs($scriptId: ID!) {
  removeAllParagraphs(scriptId: $scriptId) {
    id
    paragraphs {
      id
    }
  }
}
    `;
export type RemoveAllParagraphsMutationFn = Apollo.MutationFunction<RemoveAllParagraphsMutation, RemoveAllParagraphsMutationVariables>;

/**
 * __useRemoveAllParagraphsMutation__
 *
 * To run a mutation, you first call `useRemoveAllParagraphsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveAllParagraphsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeAllParagraphsMutation, { data, loading, error }] = useRemoveAllParagraphsMutation({
 *   variables: {
 *      scriptId: // value for 'scriptId'
 *   },
 * });
 */
export function useRemoveAllParagraphsMutation(baseOptions?: Apollo.MutationHookOptions<RemoveAllParagraphsMutation, RemoveAllParagraphsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RemoveAllParagraphsMutation, RemoveAllParagraphsMutationVariables>(RemoveAllParagraphsDocument, options);
      }
export type RemoveAllParagraphsMutationHookResult = ReturnType<typeof useRemoveAllParagraphsMutation>;
export type RemoveAllParagraphsMutationResult = Apollo.MutationResult<RemoveAllParagraphsMutation>;
export type RemoveAllParagraphsMutationOptions = Apollo.BaseMutationOptions<RemoveAllParagraphsMutation, RemoveAllParagraphsMutationVariables>;
export const RemoveAllCollaboratorsDocument = gql`
    mutation RemoveAllCollaborators($scriptId: ID!) {
  removeAllCollaborators(scriptId: $scriptId) {
    id
    collaborators {
      user {
        id
        name
      }
      role
    }
  }
}
    `;
export type RemoveAllCollaboratorsMutationFn = Apollo.MutationFunction<RemoveAllCollaboratorsMutation, RemoveAllCollaboratorsMutationVariables>;

/**
 * __useRemoveAllCollaboratorsMutation__
 *
 * To run a mutation, you first call `useRemoveAllCollaboratorsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveAllCollaboratorsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeAllCollaboratorsMutation, { data, loading, error }] = useRemoveAllCollaboratorsMutation({
 *   variables: {
 *      scriptId: // value for 'scriptId'
 *   },
 * });
 */
export function useRemoveAllCollaboratorsMutation(baseOptions?: Apollo.MutationHookOptions<RemoveAllCollaboratorsMutation, RemoveAllCollaboratorsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RemoveAllCollaboratorsMutation, RemoveAllCollaboratorsMutationVariables>(RemoveAllCollaboratorsDocument, options);
      }
export type RemoveAllCollaboratorsMutationHookResult = ReturnType<typeof useRemoveAllCollaboratorsMutation>;
export type RemoveAllCollaboratorsMutationResult = Apollo.MutationResult<RemoveAllCollaboratorsMutation>;
export type RemoveAllCollaboratorsMutationOptions = Apollo.BaseMutationOptions<RemoveAllCollaboratorsMutation, RemoveAllCollaboratorsMutationVariables>;
export const RegisterDocument = gql`
    mutation Register($name: String!, $email: String!, $password: String!) {
  register(name: $name, email: $email, password: $password) {
    id
    name
    email
    token
  }
}
    `;
export type RegisterMutationFn = Apollo.MutationFunction<RegisterMutation, RegisterMutationVariables>;

/**
 * __useRegisterMutation__
 *
 * To run a mutation, you first call `useRegisterMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegisterMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [registerMutation, { data, loading, error }] = useRegisterMutation({
 *   variables: {
 *      name: // value for 'name'
 *      email: // value for 'email'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useRegisterMutation(baseOptions?: Apollo.MutationHookOptions<RegisterMutation, RegisterMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RegisterMutation, RegisterMutationVariables>(RegisterDocument, options);
      }
export type RegisterMutationHookResult = ReturnType<typeof useRegisterMutation>;
export type RegisterMutationResult = Apollo.MutationResult<RegisterMutation>;
export type RegisterMutationOptions = Apollo.BaseMutationOptions<RegisterMutation, RegisterMutationVariables>;
export const LoginDocument = gql`
    mutation Login($name: String!, $password: String!) {
  login(name: $name, password: $password) {
    id
    name
    email
    token
  }
}
    `;
export type LoginMutationFn = Apollo.MutationFunction<LoginMutation, LoginMutationVariables>;

/**
 * __useLoginMutation__
 *
 * To run a mutation, you first call `useLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginMutation, { data, loading, error }] = useLoginMutation({
 *   variables: {
 *      name: // value for 'name'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useLoginMutation(baseOptions?: Apollo.MutationHookOptions<LoginMutation, LoginMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LoginMutation, LoginMutationVariables>(LoginDocument, options);
      }
export type LoginMutationHookResult = ReturnType<typeof useLoginMutation>;
export type LoginMutationResult = Apollo.MutationResult<LoginMutation>;
export type LoginMutationOptions = Apollo.BaseMutationOptions<LoginMutation, LoginMutationVariables>;
export const LogoutDocument = gql`
    mutation Logout {
  logout
}
    `;
export type LogoutMutationFn = Apollo.MutationFunction<LogoutMutation, LogoutMutationVariables>;

/**
 * __useLogoutMutation__
 *
 * To run a mutation, you first call `useLogoutMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLogoutMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [logoutMutation, { data, loading, error }] = useLogoutMutation({
 *   variables: {
 *   },
 * });
 */
export function useLogoutMutation(baseOptions?: Apollo.MutationHookOptions<LogoutMutation, LogoutMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LogoutMutation, LogoutMutationVariables>(LogoutDocument, options);
      }
export type LogoutMutationHookResult = ReturnType<typeof useLogoutMutation>;
export type LogoutMutationResult = Apollo.MutationResult<LogoutMutation>;
export type LogoutMutationOptions = Apollo.BaseMutationOptions<LogoutMutation, LogoutMutationVariables>;
export const UpdateUserProfileFieldDocument = gql`
    mutation UpdateUserProfileField($key: String!, $value: String!) {
  updateUserProfileField(key: $key, value: $value) {
    id
    name
    bio
    languages
    interests
  }
}
    `;
export type UpdateUserProfileFieldMutationFn = Apollo.MutationFunction<UpdateUserProfileFieldMutation, UpdateUserProfileFieldMutationVariables>;

/**
 * __useUpdateUserProfileFieldMutation__
 *
 * To run a mutation, you first call `useUpdateUserProfileFieldMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateUserProfileFieldMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateUserProfileFieldMutation, { data, loading, error }] = useUpdateUserProfileFieldMutation({
 *   variables: {
 *      key: // value for 'key'
 *      value: // value for 'value'
 *   },
 * });
 */
export function useUpdateUserProfileFieldMutation(baseOptions?: Apollo.MutationHookOptions<UpdateUserProfileFieldMutation, UpdateUserProfileFieldMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateUserProfileFieldMutation, UpdateUserProfileFieldMutationVariables>(UpdateUserProfileFieldDocument, options);
      }
export type UpdateUserProfileFieldMutationHookResult = ReturnType<typeof useUpdateUserProfileFieldMutation>;
export type UpdateUserProfileFieldMutationResult = Apollo.MutationResult<UpdateUserProfileFieldMutation>;
export type UpdateUserProfileFieldMutationOptions = Apollo.BaseMutationOptions<UpdateUserProfileFieldMutation, UpdateUserProfileFieldMutationVariables>;
export const LikeProfileDocument = gql`
    mutation LikeProfile($profileId: ID!) {
  likeProfile(profileId: $profileId) {
    status
  }
}
    `;
export type LikeProfileMutationFn = Apollo.MutationFunction<LikeProfileMutation, LikeProfileMutationVariables>;

/**
 * __useLikeProfileMutation__
 *
 * To run a mutation, you first call `useLikeProfileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLikeProfileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [likeProfileMutation, { data, loading, error }] = useLikeProfileMutation({
 *   variables: {
 *      profileId: // value for 'profileId'
 *   },
 * });
 */
export function useLikeProfileMutation(baseOptions?: Apollo.MutationHookOptions<LikeProfileMutation, LikeProfileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LikeProfileMutation, LikeProfileMutationVariables>(LikeProfileDocument, options);
      }
export type LikeProfileMutationHookResult = ReturnType<typeof useLikeProfileMutation>;
export type LikeProfileMutationResult = Apollo.MutationResult<LikeProfileMutation>;
export type LikeProfileMutationOptions = Apollo.BaseMutationOptions<LikeProfileMutation, LikeProfileMutationVariables>;
export const ViewProfileDocument = gql`
    mutation ViewProfile($profileId: ID!) {
  viewProfile(profileId: $profileId) {
    status
  }
}
    `;
export type ViewProfileMutationFn = Apollo.MutationFunction<ViewProfileMutation, ViewProfileMutationVariables>;

/**
 * __useViewProfileMutation__
 *
 * To run a mutation, you first call `useViewProfileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useViewProfileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [viewProfileMutation, { data, loading, error }] = useViewProfileMutation({
 *   variables: {
 *      profileId: // value for 'profileId'
 *   },
 * });
 */
export function useViewProfileMutation(baseOptions?: Apollo.MutationHookOptions<ViewProfileMutation, ViewProfileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ViewProfileMutation, ViewProfileMutationVariables>(ViewProfileDocument, options);
      }
export type ViewProfileMutationHookResult = ReturnType<typeof useViewProfileMutation>;
export type ViewProfileMutationResult = Apollo.MutationResult<ViewProfileMutation>;
export type ViewProfileMutationOptions = Apollo.BaseMutationOptions<ViewProfileMutation, ViewProfileMutationVariables>;
export const AcceptInvitationDocument = gql`
    mutation AcceptInvitation($scriptId: ID!) {
  acceptInvitation(scriptId: $scriptId) {
    id
  }
}
    `;
export type AcceptInvitationMutationFn = Apollo.MutationFunction<AcceptInvitationMutation, AcceptInvitationMutationVariables>;

/**
 * __useAcceptInvitationMutation__
 *
 * To run a mutation, you first call `useAcceptInvitationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAcceptInvitationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [acceptInvitationMutation, { data, loading, error }] = useAcceptInvitationMutation({
 *   variables: {
 *      scriptId: // value for 'scriptId'
 *   },
 * });
 */
export function useAcceptInvitationMutation(baseOptions?: Apollo.MutationHookOptions<AcceptInvitationMutation, AcceptInvitationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AcceptInvitationMutation, AcceptInvitationMutationVariables>(AcceptInvitationDocument, options);
      }
export type AcceptInvitationMutationHookResult = ReturnType<typeof useAcceptInvitationMutation>;
export type AcceptInvitationMutationResult = Apollo.MutationResult<AcceptInvitationMutation>;
export type AcceptInvitationMutationOptions = Apollo.BaseMutationOptions<AcceptInvitationMutation, AcceptInvitationMutationVariables>;
export const DeclineInvitationDocument = gql`
    mutation DeclineInvitation($scriptId: ID!) {
  declineInvitation(scriptId: $scriptId) {
    id
  }
}
    `;
export type DeclineInvitationMutationFn = Apollo.MutationFunction<DeclineInvitationMutation, DeclineInvitationMutationVariables>;

/**
 * __useDeclineInvitationMutation__
 *
 * To run a mutation, you first call `useDeclineInvitationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeclineInvitationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [declineInvitationMutation, { data, loading, error }] = useDeclineInvitationMutation({
 *   variables: {
 *      scriptId: // value for 'scriptId'
 *   },
 * });
 */
export function useDeclineInvitationMutation(baseOptions?: Apollo.MutationHookOptions<DeclineInvitationMutation, DeclineInvitationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeclineInvitationMutation, DeclineInvitationMutationVariables>(DeclineInvitationDocument, options);
      }
export type DeclineInvitationMutationHookResult = ReturnType<typeof useDeclineInvitationMutation>;
export type DeclineInvitationMutationResult = Apollo.MutationResult<DeclineInvitationMutation>;
export type DeclineInvitationMutationOptions = Apollo.BaseMutationOptions<DeclineInvitationMutation, DeclineInvitationMutationVariables>;
export const GetNotificationsDocument = gql`
    query GetNotifications($userId: ID!) {
  getNotifications(userId: $userId) {
    id
    type
    message
    draftTitle
    link
    isRead
    createdAt
    sender {
      id
      name
    }
  }
}
    `;

/**
 * __useGetNotificationsQuery__
 *
 * To run a query within a React component, call `useGetNotificationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetNotificationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetNotificationsQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useGetNotificationsQuery(baseOptions: Apollo.QueryHookOptions<GetNotificationsQuery, GetNotificationsQueryVariables> & ({ variables: GetNotificationsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetNotificationsQuery, GetNotificationsQueryVariables>(GetNotificationsDocument, options);
      }
export function useGetNotificationsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetNotificationsQuery, GetNotificationsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetNotificationsQuery, GetNotificationsQueryVariables>(GetNotificationsDocument, options);
        }
// @ts-ignore
export function useGetNotificationsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetNotificationsQuery, GetNotificationsQueryVariables>): Apollo.UseSuspenseQueryResult<GetNotificationsQuery, GetNotificationsQueryVariables>;
export function useGetNotificationsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetNotificationsQuery, GetNotificationsQueryVariables>): Apollo.UseSuspenseQueryResult<GetNotificationsQuery | undefined, GetNotificationsQueryVariables>;
export function useGetNotificationsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetNotificationsQuery, GetNotificationsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetNotificationsQuery, GetNotificationsQueryVariables>(GetNotificationsDocument, options);
        }
export type GetNotificationsQueryHookResult = ReturnType<typeof useGetNotificationsQuery>;
export type GetNotificationsLazyQueryHookResult = ReturnType<typeof useGetNotificationsLazyQuery>;
export type GetNotificationsSuspenseQueryHookResult = ReturnType<typeof useGetNotificationsSuspenseQuery>;
export type GetNotificationsQueryResult = Apollo.QueryResult<GetNotificationsQuery, GetNotificationsQueryVariables>;
export const OnNotificationAddedDocument = gql`
    subscription OnNotificationAdded($userId: ID!) {
  notificationAdded(userId: $userId) {
    id
    type
    message
    draftTitle
    link
    isRead
    createdAt
    sender {
      id
      name
    }
  }
}
    `;

/**
 * __useOnNotificationAddedSubscription__
 *
 * To run a query within a React component, call `useOnNotificationAddedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnNotificationAddedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnNotificationAddedSubscription({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useOnNotificationAddedSubscription(baseOptions: Apollo.SubscriptionHookOptions<OnNotificationAddedSubscription, OnNotificationAddedSubscriptionVariables> & ({ variables: OnNotificationAddedSubscriptionVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useSubscription<OnNotificationAddedSubscription, OnNotificationAddedSubscriptionVariables>(OnNotificationAddedDocument, options);
      }
export type OnNotificationAddedSubscriptionHookResult = ReturnType<typeof useOnNotificationAddedSubscription>;
export type OnNotificationAddedSubscriptionResult = Apollo.SubscriptionResult<OnNotificationAddedSubscription>;
export const GetParagraphByIdDocument = gql`
    query GetParagraphById($paragraphId: ID!) {
  getParagraphById(paragraphId: $paragraphId) {
    id
    script {
      id
      author {
        id
      }
      collaborators {
        role
        user {
          id
        }
      }
    }
    text
    status
    createdAt
    likes
    dislikes
    author {
      id
      name
    }
    comments {
      author {
        id
        name
      }
      text
      createdAt
    }
  }
}
    `;

/**
 * __useGetParagraphByIdQuery__
 *
 * To run a query within a React component, call `useGetParagraphByIdQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetParagraphByIdQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetParagraphByIdQuery({
 *   variables: {
 *      paragraphId: // value for 'paragraphId'
 *   },
 * });
 */
export function useGetParagraphByIdQuery(baseOptions: Apollo.QueryHookOptions<GetParagraphByIdQuery, GetParagraphByIdQueryVariables> & ({ variables: GetParagraphByIdQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetParagraphByIdQuery, GetParagraphByIdQueryVariables>(GetParagraphByIdDocument, options);
      }
export function useGetParagraphByIdLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetParagraphByIdQuery, GetParagraphByIdQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetParagraphByIdQuery, GetParagraphByIdQueryVariables>(GetParagraphByIdDocument, options);
        }
// @ts-ignore
export function useGetParagraphByIdSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetParagraphByIdQuery, GetParagraphByIdQueryVariables>): Apollo.UseSuspenseQueryResult<GetParagraphByIdQuery, GetParagraphByIdQueryVariables>;
export function useGetParagraphByIdSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetParagraphByIdQuery, GetParagraphByIdQueryVariables>): Apollo.UseSuspenseQueryResult<GetParagraphByIdQuery | undefined, GetParagraphByIdQueryVariables>;
export function useGetParagraphByIdSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetParagraphByIdQuery, GetParagraphByIdQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetParagraphByIdQuery, GetParagraphByIdQueryVariables>(GetParagraphByIdDocument, options);
        }
export type GetParagraphByIdQueryHookResult = ReturnType<typeof useGetParagraphByIdQuery>;
export type GetParagraphByIdLazyQueryHookResult = ReturnType<typeof useGetParagraphByIdLazyQuery>;
export type GetParagraphByIdSuspenseQueryHookResult = ReturnType<typeof useGetParagraphByIdSuspenseQuery>;
export type GetParagraphByIdQueryResult = Apollo.QueryResult<GetParagraphByIdQuery, GetParagraphByIdQueryVariables>;
export const GetFilteredRequestsDocument = gql`
    query GetFilteredRequests($scriptId: ID!, $userId: ID, $status: String) {
  getFilteredRequests(scriptId: $scriptId, userId: $userId, status: $status) {
    id
    text
    status
    createdAt
    author {
      id
      name
    }
    likes
    dislikes
    comments {
      text
      createdAt
      author {
        name
      }
    }
  }
}
    `;

/**
 * __useGetFilteredRequestsQuery__
 *
 * To run a query within a React component, call `useGetFilteredRequestsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetFilteredRequestsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetFilteredRequestsQuery({
 *   variables: {
 *      scriptId: // value for 'scriptId'
 *      userId: // value for 'userId'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useGetFilteredRequestsQuery(baseOptions: Apollo.QueryHookOptions<GetFilteredRequestsQuery, GetFilteredRequestsQueryVariables> & ({ variables: GetFilteredRequestsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetFilteredRequestsQuery, GetFilteredRequestsQueryVariables>(GetFilteredRequestsDocument, options);
      }
export function useGetFilteredRequestsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetFilteredRequestsQuery, GetFilteredRequestsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetFilteredRequestsQuery, GetFilteredRequestsQueryVariables>(GetFilteredRequestsDocument, options);
        }
// @ts-ignore
export function useGetFilteredRequestsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetFilteredRequestsQuery, GetFilteredRequestsQueryVariables>): Apollo.UseSuspenseQueryResult<GetFilteredRequestsQuery, GetFilteredRequestsQueryVariables>;
export function useGetFilteredRequestsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetFilteredRequestsQuery, GetFilteredRequestsQueryVariables>): Apollo.UseSuspenseQueryResult<GetFilteredRequestsQuery | undefined, GetFilteredRequestsQueryVariables>;
export function useGetFilteredRequestsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetFilteredRequestsQuery, GetFilteredRequestsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetFilteredRequestsQuery, GetFilteredRequestsQueryVariables>(GetFilteredRequestsDocument, options);
        }
export type GetFilteredRequestsQueryHookResult = ReturnType<typeof useGetFilteredRequestsQuery>;
export type GetFilteredRequestsLazyQueryHookResult = ReturnType<typeof useGetFilteredRequestsLazyQuery>;
export type GetFilteredRequestsSuspenseQueryHookResult = ReturnType<typeof useGetFilteredRequestsSuspenseQuery>;
export type GetFilteredRequestsQueryResult = Apollo.QueryResult<GetFilteredRequestsQuery, GetFilteredRequestsQueryVariables>;
export const GetPendingParagraphsDocument = gql`
    query GetPendingParagraphs($scriptId: ID!) {
  getPendingParagraphs(scriptId: $scriptId) {
    id
    text
    createdAt
    status
    author {
      name
    }
  }
}
    `;

/**
 * __useGetPendingParagraphsQuery__
 *
 * To run a query within a React component, call `useGetPendingParagraphsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPendingParagraphsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPendingParagraphsQuery({
 *   variables: {
 *      scriptId: // value for 'scriptId'
 *   },
 * });
 */
export function useGetPendingParagraphsQuery(baseOptions: Apollo.QueryHookOptions<GetPendingParagraphsQuery, GetPendingParagraphsQueryVariables> & ({ variables: GetPendingParagraphsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetPendingParagraphsQuery, GetPendingParagraphsQueryVariables>(GetPendingParagraphsDocument, options);
      }
export function useGetPendingParagraphsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetPendingParagraphsQuery, GetPendingParagraphsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetPendingParagraphsQuery, GetPendingParagraphsQueryVariables>(GetPendingParagraphsDocument, options);
        }
// @ts-ignore
export function useGetPendingParagraphsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetPendingParagraphsQuery, GetPendingParagraphsQueryVariables>): Apollo.UseSuspenseQueryResult<GetPendingParagraphsQuery, GetPendingParagraphsQueryVariables>;
export function useGetPendingParagraphsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetPendingParagraphsQuery, GetPendingParagraphsQueryVariables>): Apollo.UseSuspenseQueryResult<GetPendingParagraphsQuery | undefined, GetPendingParagraphsQueryVariables>;
export function useGetPendingParagraphsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetPendingParagraphsQuery, GetPendingParagraphsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetPendingParagraphsQuery, GetPendingParagraphsQueryVariables>(GetPendingParagraphsDocument, options);
        }
export type GetPendingParagraphsQueryHookResult = ReturnType<typeof useGetPendingParagraphsQuery>;
export type GetPendingParagraphsLazyQueryHookResult = ReturnType<typeof useGetPendingParagraphsLazyQuery>;
export type GetPendingParagraphsSuspenseQueryHookResult = ReturnType<typeof useGetPendingParagraphsSuspenseQuery>;
export type GetPendingParagraphsQueryResult = Apollo.QueryResult<GetPendingParagraphsQuery, GetPendingParagraphsQueryVariables>;
export const ExportDocumentDocument = gql`
    query ExportDocument($scriptId: ID!, $format: String!) {
  exportDocument(scriptId: $scriptId, format: $format) {
    filename
    content
    contentType
  }
}
    `;

/**
 * __useExportDocumentQuery__
 *
 * To run a query within a React component, call `useExportDocumentQuery` and pass it any options that fit your needs.
 * When your component renders, `useExportDocumentQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useExportDocumentQuery({
 *   variables: {
 *      scriptId: // value for 'scriptId'
 *      format: // value for 'format'
 *   },
 * });
 */
export function useExportDocumentQuery(baseOptions: Apollo.QueryHookOptions<ExportDocumentQuery, ExportDocumentQueryVariables> & ({ variables: ExportDocumentQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ExportDocumentQuery, ExportDocumentQueryVariables>(ExportDocumentDocument, options);
      }
export function useExportDocumentLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ExportDocumentQuery, ExportDocumentQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ExportDocumentQuery, ExportDocumentQueryVariables>(ExportDocumentDocument, options);
        }
// @ts-ignore
export function useExportDocumentSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ExportDocumentQuery, ExportDocumentQueryVariables>): Apollo.UseSuspenseQueryResult<ExportDocumentQuery, ExportDocumentQueryVariables>;
export function useExportDocumentSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ExportDocumentQuery, ExportDocumentQueryVariables>): Apollo.UseSuspenseQueryResult<ExportDocumentQuery | undefined, ExportDocumentQueryVariables>;
export function useExportDocumentSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ExportDocumentQuery, ExportDocumentQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ExportDocumentQuery, ExportDocumentQueryVariables>(ExportDocumentDocument, options);
        }
export type ExportDocumentQueryHookResult = ReturnType<typeof useExportDocumentQuery>;
export type ExportDocumentLazyQueryHookResult = ReturnType<typeof useExportDocumentLazyQuery>;
export type ExportDocumentSuspenseQueryHookResult = ReturnType<typeof useExportDocumentSuspenseQuery>;
export type ExportDocumentQueryResult = Apollo.QueryResult<ExportDocumentQuery, ExportDocumentQueryVariables>;
export const GetScriptByIdDocument = gql`
    query GetScriptById($id: ID!) {
  getScriptById(id: $id) {
    id
    title
    visibility
    languages
    genres
    description
    createdAt
    combinedText
    likes
    dislikes
    author {
      id
      name
    }
    collaborators {
      role
      user {
        id
        name
      }
    }
    paragraphs {
      id
      text
      status
      likes
      dislikes
      createdAt
      author {
        id
        name
      }
      comments {
        author {
          id
          name
        }
        text
        createdAt
      }
    }
  }
}
    `;

/**
 * __useGetScriptByIdQuery__
 *
 * To run a query within a React component, call `useGetScriptByIdQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetScriptByIdQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetScriptByIdQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetScriptByIdQuery(baseOptions: Apollo.QueryHookOptions<GetScriptByIdQuery, GetScriptByIdQueryVariables> & ({ variables: GetScriptByIdQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetScriptByIdQuery, GetScriptByIdQueryVariables>(GetScriptByIdDocument, options);
      }
export function useGetScriptByIdLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetScriptByIdQuery, GetScriptByIdQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetScriptByIdQuery, GetScriptByIdQueryVariables>(GetScriptByIdDocument, options);
        }
// @ts-ignore
export function useGetScriptByIdSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetScriptByIdQuery, GetScriptByIdQueryVariables>): Apollo.UseSuspenseQueryResult<GetScriptByIdQuery, GetScriptByIdQueryVariables>;
export function useGetScriptByIdSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetScriptByIdQuery, GetScriptByIdQueryVariables>): Apollo.UseSuspenseQueryResult<GetScriptByIdQuery | undefined, GetScriptByIdQueryVariables>;
export function useGetScriptByIdSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetScriptByIdQuery, GetScriptByIdQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetScriptByIdQuery, GetScriptByIdQueryVariables>(GetScriptByIdDocument, options);
        }
export type GetScriptByIdQueryHookResult = ReturnType<typeof useGetScriptByIdQuery>;
export type GetScriptByIdLazyQueryHookResult = ReturnType<typeof useGetScriptByIdLazyQuery>;
export type GetScriptByIdSuspenseQueryHookResult = ReturnType<typeof useGetScriptByIdSuspenseQuery>;
export type GetScriptByIdQueryResult = Apollo.QueryResult<GetScriptByIdQuery, GetScriptByIdQueryVariables>;
export const GetScriptsByGenresDocument = gql`
    query GetScriptsByGenres($genres: [String!]!) {
  getScriptsByGenres(genres: $genres) {
    id
    title
    genres
    description
    likes
    languages
    dislikes
    createdAt
    author {
      name
    }
  }
}
    `;

/**
 * __useGetScriptsByGenresQuery__
 *
 * To run a query within a React component, call `useGetScriptsByGenresQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetScriptsByGenresQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetScriptsByGenresQuery({
 *   variables: {
 *      genres: // value for 'genres'
 *   },
 * });
 */
export function useGetScriptsByGenresQuery(baseOptions: Apollo.QueryHookOptions<GetScriptsByGenresQuery, GetScriptsByGenresQueryVariables> & ({ variables: GetScriptsByGenresQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetScriptsByGenresQuery, GetScriptsByGenresQueryVariables>(GetScriptsByGenresDocument, options);
      }
export function useGetScriptsByGenresLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetScriptsByGenresQuery, GetScriptsByGenresQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetScriptsByGenresQuery, GetScriptsByGenresQueryVariables>(GetScriptsByGenresDocument, options);
        }
// @ts-ignore
export function useGetScriptsByGenresSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetScriptsByGenresQuery, GetScriptsByGenresQueryVariables>): Apollo.UseSuspenseQueryResult<GetScriptsByGenresQuery, GetScriptsByGenresQueryVariables>;
export function useGetScriptsByGenresSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetScriptsByGenresQuery, GetScriptsByGenresQueryVariables>): Apollo.UseSuspenseQueryResult<GetScriptsByGenresQuery | undefined, GetScriptsByGenresQueryVariables>;
export function useGetScriptsByGenresSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetScriptsByGenresQuery, GetScriptsByGenresQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetScriptsByGenresQuery, GetScriptsByGenresQueryVariables>(GetScriptsByGenresDocument, options);
        }
export type GetScriptsByGenresQueryHookResult = ReturnType<typeof useGetScriptsByGenresQuery>;
export type GetScriptsByGenresLazyQueryHookResult = ReturnType<typeof useGetScriptsByGenresLazyQuery>;
export type GetScriptsByGenresSuspenseQueryHookResult = ReturnType<typeof useGetScriptsByGenresSuspenseQuery>;
export type GetScriptsByGenresQueryResult = Apollo.QueryResult<GetScriptsByGenresQuery, GetScriptsByGenresQueryVariables>;
export const GetScriptContributorsDocument = gql`
    query GetScriptContributors($scriptId: ID!) {
  getScriptContributors(scriptId: $scriptId) {
    contributors {
      userId
      details {
        name
        paragraphs {
          id
          text
          status
          createdAt
          likes
          dislikes
          author {
            name
          }
          comments {
            author {
              name
            }
            text
            createdAt
          }
        }
      }
    }
  }
}
    `;

/**
 * __useGetScriptContributorsQuery__
 *
 * To run a query within a React component, call `useGetScriptContributorsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetScriptContributorsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetScriptContributorsQuery({
 *   variables: {
 *      scriptId: // value for 'scriptId'
 *   },
 * });
 */
export function useGetScriptContributorsQuery(baseOptions: Apollo.QueryHookOptions<GetScriptContributorsQuery, GetScriptContributorsQueryVariables> & ({ variables: GetScriptContributorsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetScriptContributorsQuery, GetScriptContributorsQueryVariables>(GetScriptContributorsDocument, options);
      }
export function useGetScriptContributorsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetScriptContributorsQuery, GetScriptContributorsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetScriptContributorsQuery, GetScriptContributorsQueryVariables>(GetScriptContributorsDocument, options);
        }
// @ts-ignore
export function useGetScriptContributorsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetScriptContributorsQuery, GetScriptContributorsQueryVariables>): Apollo.UseSuspenseQueryResult<GetScriptContributorsQuery, GetScriptContributorsQueryVariables>;
export function useGetScriptContributorsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetScriptContributorsQuery, GetScriptContributorsQueryVariables>): Apollo.UseSuspenseQueryResult<GetScriptContributorsQuery | undefined, GetScriptContributorsQueryVariables>;
export function useGetScriptContributorsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetScriptContributorsQuery, GetScriptContributorsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetScriptContributorsQuery, GetScriptContributorsQueryVariables>(GetScriptContributorsDocument, options);
        }
export type GetScriptContributorsQueryHookResult = ReturnType<typeof useGetScriptContributorsQuery>;
export type GetScriptContributorsLazyQueryHookResult = ReturnType<typeof useGetScriptContributorsLazyQuery>;
export type GetScriptContributorsSuspenseQueryHookResult = ReturnType<typeof useGetScriptContributorsSuspenseQuery>;
export type GetScriptContributorsQueryResult = Apollo.QueryResult<GetScriptContributorsQuery, GetScriptContributorsQueryVariables>;
export const GetUserContributionsByScriptDocument = gql`
    query GetUserContributionsByScript($userId: ID!, $scriptId: ID!) {
  getUserContributionsByScript(userId: $userId, scriptId: $scriptId) {
    id
    text
    status
    createdAt
    likes
    dislikes
    script {
      id
      title
    }
    author {
      id
      name
    }
    comments {
      text
      createdAt
      author {
        name
      }
    }
  }
}
    `;

/**
 * __useGetUserContributionsByScriptQuery__
 *
 * To run a query within a React component, call `useGetUserContributionsByScriptQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserContributionsByScriptQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserContributionsByScriptQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *      scriptId: // value for 'scriptId'
 *   },
 * });
 */
export function useGetUserContributionsByScriptQuery(baseOptions: Apollo.QueryHookOptions<GetUserContributionsByScriptQuery, GetUserContributionsByScriptQueryVariables> & ({ variables: GetUserContributionsByScriptQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetUserContributionsByScriptQuery, GetUserContributionsByScriptQueryVariables>(GetUserContributionsByScriptDocument, options);
      }
export function useGetUserContributionsByScriptLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUserContributionsByScriptQuery, GetUserContributionsByScriptQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetUserContributionsByScriptQuery, GetUserContributionsByScriptQueryVariables>(GetUserContributionsByScriptDocument, options);
        }
// @ts-ignore
export function useGetUserContributionsByScriptSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetUserContributionsByScriptQuery, GetUserContributionsByScriptQueryVariables>): Apollo.UseSuspenseQueryResult<GetUserContributionsByScriptQuery, GetUserContributionsByScriptQueryVariables>;
export function useGetUserContributionsByScriptSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserContributionsByScriptQuery, GetUserContributionsByScriptQueryVariables>): Apollo.UseSuspenseQueryResult<GetUserContributionsByScriptQuery | undefined, GetUserContributionsByScriptQueryVariables>;
export function useGetUserContributionsByScriptSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserContributionsByScriptQuery, GetUserContributionsByScriptQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetUserContributionsByScriptQuery, GetUserContributionsByScriptQueryVariables>(GetUserContributionsByScriptDocument, options);
        }
export type GetUserContributionsByScriptQueryHookResult = ReturnType<typeof useGetUserContributionsByScriptQuery>;
export type GetUserContributionsByScriptLazyQueryHookResult = ReturnType<typeof useGetUserContributionsByScriptLazyQuery>;
export type GetUserContributionsByScriptSuspenseQueryHookResult = ReturnType<typeof useGetUserContributionsByScriptSuspenseQuery>;
export type GetUserContributionsByScriptQueryResult = Apollo.QueryResult<GetUserContributionsByScriptQuery, GetUserContributionsByScriptQueryVariables>;
export const GetUserProfileDocument = gql`
    query GetUserProfile($id: ID!) {
  getUserProfile(id: $id) {
    id
    name
    username
    email
    bio
    languages
    favourites
    likes
    followers
    follows
    views
  }
}
    `;

/**
 * __useGetUserProfileQuery__
 *
 * To run a query within a React component, call `useGetUserProfileQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserProfileQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserProfileQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetUserProfileQuery(baseOptions: Apollo.QueryHookOptions<GetUserProfileQuery, GetUserProfileQueryVariables> & ({ variables: GetUserProfileQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetUserProfileQuery, GetUserProfileQueryVariables>(GetUserProfileDocument, options);
      }
export function useGetUserProfileLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUserProfileQuery, GetUserProfileQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetUserProfileQuery, GetUserProfileQueryVariables>(GetUserProfileDocument, options);
        }
// @ts-ignore
export function useGetUserProfileSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetUserProfileQuery, GetUserProfileQueryVariables>): Apollo.UseSuspenseQueryResult<GetUserProfileQuery, GetUserProfileQueryVariables>;
export function useGetUserProfileSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserProfileQuery, GetUserProfileQueryVariables>): Apollo.UseSuspenseQueryResult<GetUserProfileQuery | undefined, GetUserProfileQueryVariables>;
export function useGetUserProfileSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserProfileQuery, GetUserProfileQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetUserProfileQuery, GetUserProfileQueryVariables>(GetUserProfileDocument, options);
        }
export type GetUserProfileQueryHookResult = ReturnType<typeof useGetUserProfileQuery>;
export type GetUserProfileLazyQueryHookResult = ReturnType<typeof useGetUserProfileLazyQuery>;
export type GetUserProfileSuspenseQueryHookResult = ReturnType<typeof useGetUserProfileSuspenseQuery>;
export type GetUserProfileQueryResult = Apollo.QueryResult<GetUserProfileQuery, GetUserProfileQueryVariables>;
export const GetUserScriptsDocument = gql`
    query GetUserScripts($userId: ID!) {
  getUserScripts(userId: $userId) {
    id
    title
    visibility
    description
    languages
    genres
    createdAt
    updatedAt
    author {
      id
      name
    }
  }
}
    `;

/**
 * __useGetUserScriptsQuery__
 *
 * To run a query within a React component, call `useGetUserScriptsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserScriptsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserScriptsQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useGetUserScriptsQuery(baseOptions: Apollo.QueryHookOptions<GetUserScriptsQuery, GetUserScriptsQueryVariables> & ({ variables: GetUserScriptsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetUserScriptsQuery, GetUserScriptsQueryVariables>(GetUserScriptsDocument, options);
      }
export function useGetUserScriptsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUserScriptsQuery, GetUserScriptsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetUserScriptsQuery, GetUserScriptsQueryVariables>(GetUserScriptsDocument, options);
        }
// @ts-ignore
export function useGetUserScriptsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetUserScriptsQuery, GetUserScriptsQueryVariables>): Apollo.UseSuspenseQueryResult<GetUserScriptsQuery, GetUserScriptsQueryVariables>;
export function useGetUserScriptsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserScriptsQuery, GetUserScriptsQueryVariables>): Apollo.UseSuspenseQueryResult<GetUserScriptsQuery | undefined, GetUserScriptsQueryVariables>;
export function useGetUserScriptsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserScriptsQuery, GetUserScriptsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetUserScriptsQuery, GetUserScriptsQueryVariables>(GetUserScriptsDocument, options);
        }
export type GetUserScriptsQueryHookResult = ReturnType<typeof useGetUserScriptsQuery>;
export type GetUserScriptsLazyQueryHookResult = ReturnType<typeof useGetUserScriptsLazyQuery>;
export type GetUserScriptsSuspenseQueryHookResult = ReturnType<typeof useGetUserScriptsSuspenseQuery>;
export type GetUserScriptsQueryResult = Apollo.QueryResult<GetUserScriptsQuery, GetUserScriptsQueryVariables>;
export const GetUserContributionsDocument = gql`
    query GetUserContributions($userId: ID!) {
  getUserContributions(userId: $userId) {
    id
    status
    text
    likes
    dislikes
    createdAt
    script {
      id
      title
    }
    comments {
      author {
        name
      }
      text
      createdAt
    }
  }
}
    `;

/**
 * __useGetUserContributionsQuery__
 *
 * To run a query within a React component, call `useGetUserContributionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserContributionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserContributionsQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useGetUserContributionsQuery(baseOptions: Apollo.QueryHookOptions<GetUserContributionsQuery, GetUserContributionsQueryVariables> & ({ variables: GetUserContributionsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetUserContributionsQuery, GetUserContributionsQueryVariables>(GetUserContributionsDocument, options);
      }
export function useGetUserContributionsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUserContributionsQuery, GetUserContributionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetUserContributionsQuery, GetUserContributionsQueryVariables>(GetUserContributionsDocument, options);
        }
// @ts-ignore
export function useGetUserContributionsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetUserContributionsQuery, GetUserContributionsQueryVariables>): Apollo.UseSuspenseQueryResult<GetUserContributionsQuery, GetUserContributionsQueryVariables>;
export function useGetUserContributionsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserContributionsQuery, GetUserContributionsQueryVariables>): Apollo.UseSuspenseQueryResult<GetUserContributionsQuery | undefined, GetUserContributionsQueryVariables>;
export function useGetUserContributionsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserContributionsQuery, GetUserContributionsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetUserContributionsQuery, GetUserContributionsQueryVariables>(GetUserContributionsDocument, options);
        }
export type GetUserContributionsQueryHookResult = ReturnType<typeof useGetUserContributionsQuery>;
export type GetUserContributionsLazyQueryHookResult = ReturnType<typeof useGetUserContributionsLazyQuery>;
export type GetUserContributionsSuspenseQueryHookResult = ReturnType<typeof useGetUserContributionsSuspenseQuery>;
export type GetUserContributionsQueryResult = Apollo.QueryResult<GetUserContributionsQuery, GetUserContributionsQueryVariables>;
export const GetUserFavouritesDocument = gql`
    query GetUserFavourites($userId: ID!) {
  getUserFavourites(userId: $userId) {
    id
    title
    visibility
    description
    languages
    genres
    createdAt
    updatedAt
    author {
      id
      name
    }
  }
}
    `;

/**
 * __useGetUserFavouritesQuery__
 *
 * To run a query within a React component, call `useGetUserFavouritesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserFavouritesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserFavouritesQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useGetUserFavouritesQuery(baseOptions: Apollo.QueryHookOptions<GetUserFavouritesQuery, GetUserFavouritesQueryVariables> & ({ variables: GetUserFavouritesQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetUserFavouritesQuery, GetUserFavouritesQueryVariables>(GetUserFavouritesDocument, options);
      }
export function useGetUserFavouritesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUserFavouritesQuery, GetUserFavouritesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetUserFavouritesQuery, GetUserFavouritesQueryVariables>(GetUserFavouritesDocument, options);
        }
// @ts-ignore
export function useGetUserFavouritesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetUserFavouritesQuery, GetUserFavouritesQueryVariables>): Apollo.UseSuspenseQueryResult<GetUserFavouritesQuery, GetUserFavouritesQueryVariables>;
export function useGetUserFavouritesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserFavouritesQuery, GetUserFavouritesQueryVariables>): Apollo.UseSuspenseQueryResult<GetUserFavouritesQuery | undefined, GetUserFavouritesQueryVariables>;
export function useGetUserFavouritesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserFavouritesQuery, GetUserFavouritesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetUserFavouritesQuery, GetUserFavouritesQueryVariables>(GetUserFavouritesDocument, options);
        }
export type GetUserFavouritesQueryHookResult = ReturnType<typeof useGetUserFavouritesQuery>;
export type GetUserFavouritesLazyQueryHookResult = ReturnType<typeof useGetUserFavouritesLazyQuery>;
export type GetUserFavouritesSuspenseQueryHookResult = ReturnType<typeof useGetUserFavouritesSuspenseQuery>;
export type GetUserFavouritesQueryResult = Apollo.QueryResult<GetUserFavouritesQuery, GetUserFavouritesQueryVariables>;
export const SearchUsersDocument = gql`
    query SearchUsers($query: String!) {
  searchUsers(query: $query) {
    id
    name
    username
  }
}
    `;

/**
 * __useSearchUsersQuery__
 *
 * To run a query within a React component, call `useSearchUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchUsersQuery({
 *   variables: {
 *      query: // value for 'query'
 *   },
 * });
 */
export function useSearchUsersQuery(baseOptions: Apollo.QueryHookOptions<SearchUsersQuery, SearchUsersQueryVariables> & ({ variables: SearchUsersQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SearchUsersQuery, SearchUsersQueryVariables>(SearchUsersDocument, options);
      }
export function useSearchUsersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SearchUsersQuery, SearchUsersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SearchUsersQuery, SearchUsersQueryVariables>(SearchUsersDocument, options);
        }
// @ts-ignore
export function useSearchUsersSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<SearchUsersQuery, SearchUsersQueryVariables>): Apollo.UseSuspenseQueryResult<SearchUsersQuery, SearchUsersQueryVariables>;
export function useSearchUsersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SearchUsersQuery, SearchUsersQueryVariables>): Apollo.UseSuspenseQueryResult<SearchUsersQuery | undefined, SearchUsersQueryVariables>;
export function useSearchUsersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SearchUsersQuery, SearchUsersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SearchUsersQuery, SearchUsersQueryVariables>(SearchUsersDocument, options);
        }
export type SearchUsersQueryHookResult = ReturnType<typeof useSearchUsersQuery>;
export type SearchUsersLazyQueryHookResult = ReturnType<typeof useSearchUsersLazyQuery>;
export type SearchUsersSuspenseQueryHookResult = ReturnType<typeof useSearchUsersSuspenseQuery>;
export type SearchUsersQueryResult = Apollo.QueryResult<SearchUsersQuery, SearchUsersQueryVariables>;