import { NextRequest, NextResponse } from 'next/server';
import {
  getAllOwnerMessages,
  getUnreadMessageCount,
  markMessageAsRead,
  markAllMessagesAsRead,
  deleteOwnerMessage,
} from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Check owner authentication
    const ownerSession = request.cookies.get('owner_session');
    if (ownerSession?.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messages = getAllOwnerMessages();
    const unreadCount = getUnreadMessageCount();

    return NextResponse.json({ messages, unreadCount });
  } catch (error) {
    console.error('Error fetching inbox:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inbox' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Check owner authentication
    const ownerSession = request.cookies.get('owner_session');
    if (ownerSession?.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, messageId } = await request.json();

    if (action === 'markRead' && messageId) {
      markMessageAsRead(messageId);
      return NextResponse.json({ success: true });
    }

    if (action === 'markAllRead') {
      markAllMessagesAsRead();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating inbox:', error);
    return NextResponse.json(
      { error: 'Failed to update inbox' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check owner authentication
    const ownerSession = request.cookies.get('owner_session');
    if (ownerSession?.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = await request.json();

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
    }

    deleteOwnerMessage(messageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
