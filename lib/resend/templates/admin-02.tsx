import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Text,
} from '@react-email/components'
import * as React from 'react'

export interface Admin02Props {
  order_id: string
  order_number: string
  customer_name: string
  customer_email: string
  admin_url: string
}

export default function Admin02({
  order_number,
  customer_name,
  customer_email,
  admin_url,
}: Admin02Props) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f5f5f5', fontFamily: 'Arial, sans-serif' }}>
        <Container
          style={{
            maxWidth: '560px',
            margin: '32px auto',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '32px',
          }}
        >
          <Heading style={{ fontSize: '22px', color: '#111' }}>
            Payment Screenshot Uploaded
          </Heading>
          <Text style={{ color: '#555', marginTop: '0' }}>
            A customer has uploaded a payment screenshot for order{' '}
            <strong>{order_number}</strong>.
          </Text>

          <Hr />

          <Text style={{ fontSize: '14px', margin: '0 0 4px' }}>
            <strong>Customer:</strong> {customer_name}
          </Text>
          <Text style={{ fontSize: '14px', margin: '0 0 4px' }}>
            <strong>Email:</strong> {customer_email}
          </Text>
          <Text style={{ fontSize: '14px', margin: '0 0 4px' }}>
            <strong>Order:</strong> {order_number}
          </Text>

          <Hr />

          <Text style={{ fontSize: '14px', color: '#555' }}>
            Review the screenshot and confirm or reject the payment.
          </Text>

          <Link
            href={admin_url}
            style={{
              display: 'inline-block',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              borderRadius: '6px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 'bold',
              textDecoration: 'none',
              marginTop: '4px',
            }}
          >
            Review Payment
          </Link>

          <Hr />
          <Text style={{ fontSize: '12px', color: '#999' }}>
            Lavaca MNL Admin Notification
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
