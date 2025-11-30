package com.cooksys.groupfinal.services;

import com.cooksys.groupfinal.dtos.AnnouncementDto;
import com.cooksys.groupfinal.dtos.AnnouncementRequestDto;
import com.cooksys.groupfinal.dtos.CredentialsDto;

public interface AnnouncementService {

	AnnouncementDto createAnnouncement(Long companyId, AnnouncementRequestDto request);

	AnnouncementDto updateAnnouncement(Long announcementId, AnnouncementRequestDto request);

	void deleteAnnouncement(Long announcementId, CredentialsDto credentials);

}
