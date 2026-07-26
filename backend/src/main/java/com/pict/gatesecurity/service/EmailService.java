package com.pict.gatesecurity.service;

import com.pict.gatesecurity.entity.Notification;

public interface EmailService {

    void sendEmail(Notification notification);

    boolean isConfigured();
}
