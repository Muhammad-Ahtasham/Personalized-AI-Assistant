import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/app/lib/prisma';

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  // Get the ID and type
  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook with and ID of ${id} and type of ${eventType}`);
  console.log('Webhook body:', body);

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    
    // Get the primary email
    const primaryEmail = email_addresses?.find(email => email.id === evt.data.primary_email_address_id);
    
    if (primaryEmail) {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { clerkId: id },
        });

        if (!existingUser) {
          // Create user in database
          await prisma.user.create({
            data: {
              clerkId: id,
              email: primaryEmail.email_address,
              firstName: first_name || null,
              lastName: last_name || null,
            },
          });
          console.log(`User created in database: ${id}`);
        }
      } catch (error) {
        console.error('Error creating user in database:', error);
        return new Response('Error creating user in database', {
          status: 500
        });
      }
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    
    // Get the primary email
    const primaryEmail = email_addresses?.find(email => email.id === evt.data.primary_email_address_id);
    
    if (primaryEmail) {
      try {
        // Update user in database
        await prisma.user.update({
          where: { clerkId: id },
          data: {
            email: primaryEmail.email_address,
            firstName: first_name || null,
            lastName: last_name || null,
          },
        });
        console.log(`User updated in database: ${id}`);
      } catch (error) {
        console.error('Error updating user in database:', error);
        return new Response('Error updating user in database', {
          status: 500
        });
      }
    }
  }

  if (eventType === 'user.deleted') {
    try {
      // Delete user from database
      await prisma.user.delete({
        where: { clerkId: id },
      });
      console.log(`User deleted from database: ${id}`);
    } catch (error) {
      console.error('Error deleting user from database:', error);
      return new Response('Error deleting user from database', {
        status: 500
      });
    }
  }

  return new Response('', { status: 200 });
} 