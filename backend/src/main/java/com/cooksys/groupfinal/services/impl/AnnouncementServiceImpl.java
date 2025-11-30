package com.cooksys.groupfinal.services.impl;

import java.util.HashSet;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.cooksys.groupfinal.dtos.AnnouncementDto;
import com.cooksys.groupfinal.dtos.AnnouncementRequestDto;
import com.cooksys.groupfinal.dtos.CredentialsDto;
import com.cooksys.groupfinal.entities.Announcement;
import com.cooksys.groupfinal.entities.Company;
import com.cooksys.groupfinal.entities.User;
import com.cooksys.groupfinal.exceptions.BadRequestException;
import com.cooksys.groupfinal.exceptions.NotAuthorizedException;
import com.cooksys.groupfinal.exceptions.NotFoundException;
import com.cooksys.groupfinal.mappers.AnnouncementMapper;
import com.cooksys.groupfinal.repositories.AnnouncementRepository;
import com.cooksys.groupfinal.repositories.CompanyRepository;
import com.cooksys.groupfinal.repositories.UserRepository;
import com.cooksys.groupfinal.services.AnnouncementService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AnnouncementServiceImpl implements AnnouncementService {
	private final AnnouncementRepository announcementRepository;
	private final UserRepository userRepository;
	private final CompanyRepository companyRepository;

	private final AnnouncementMapper announcementMapper;

	@Override
	public AnnouncementDto createAnnouncement(Long companyId, AnnouncementRequestDto request) {
		validateAnnouncementRequest(request);
		Optional<Company> optionalCompany = companyRepository.findById(companyId);
		if (optionalCompany.isEmpty()) {
			throw new NotFoundException("No company found with id: " + companyId);
		}

		User author = getUserFromCredentials(request.getCredentials());
		Company company = optionalCompany.get();

		validateAdminForCompany(author, company);

		Announcement announcement = new Announcement();
		announcement.setTitle(request.getTitle());
		announcement.setMessage(request.getMessage());
		announcement.setAuthor(author);
		announcement.setCompany(company);

		addAnnouncementToRelations(announcement, company, author);

		return announcementMapper.entityToDto(announcementRepository.saveAndFlush(announcement));
	}

	@Override
	public AnnouncementDto updateAnnouncement(Long announcementId, AnnouncementRequestDto request) {
		validateAnnouncementRequest(request);
		Announcement announcement = findAnnouncement(announcementId);
		User author = getUserFromCredentials(request.getCredentials());
		validateAdminForCompany(author, announcement.getCompany());

		User previousAuthor = announcement.getAuthor();
		announcement.setTitle(request.getTitle());
		announcement.setMessage(request.getMessage());
		announcement.setAuthor(author);

		if (previousAuthor != null && previousAuthor.getAnnouncements() != null
				&& previousAuthor.getId() != author.getId()) {
			previousAuthor.getAnnouncements().remove(announcement);
			userRepository.saveAndFlush(previousAuthor);
		}

		if (author.getAnnouncements() == null) {
			author.setAnnouncements(new HashSet<>());
		}
		if (!author.getAnnouncements().contains(announcement)) {
			author.getAnnouncements().add(announcement);
			userRepository.saveAndFlush(author);
		}

		return announcementMapper.entityToDto(announcementRepository.saveAndFlush(announcement));
	}

	@Override
	public void deleteAnnouncement(Long announcementId, CredentialsDto credentials) {
		if (credentials == null) {
			throw new BadRequestException("Credentials are required to delete an announcement.");
		}

		Announcement announcement = findAnnouncement(announcementId);
		User requester = getUserFromCredentials(credentials);
		validateAdminForCompany(requester, announcement.getCompany());

		Company company = announcement.getCompany();
		if (company.getAnnouncements() != null) {
			company.getAnnouncements().remove(announcement);
			companyRepository.saveAndFlush(company);
		}

		User author = announcement.getAuthor();
		if (author != null && author.getAnnouncements() != null) {
			author.getAnnouncements().remove(announcement);
			userRepository.saveAndFlush(author);
		}

		announcementRepository.delete(announcement);
	}

	private User getUserFromCredentials(CredentialsDto credentialsDto) {
		User user;

		if (credentialsDto.getPassword() == null || credentialsDto.getUsername() == null) {
			throw new BadRequestException("Username and password are required");
		}
		String username = credentialsDto.getUsername();
		Optional<User> optionalUser = userRepository.findByCredentialsUsernameAndActiveTrue(username);
		if (optionalUser.isEmpty()) {
			throw new NotFoundException("No active users found with the provided credentials.");
		} else {
			user = optionalUser.get();
			if (!user.getCredentials().getPassword().equals(credentialsDto.getPassword())) {
				throw new NotAuthorizedException("Invalid credentials for user: " + username);
			}
			if (!user.isAdmin() || !user.getStatus().equals("JOINED")) {
				throw new NotAuthorizedException("Invalid authorization for user: " + username);
			}
		}
		return user;
	}

	private void validateAnnouncementRequest(AnnouncementRequestDto request) {
		if (request == null || request.getTitle() == null || request.getMessage() == null
				|| request.getCredentials() == null) {
			throw new BadRequestException("Missing required parameters in request.");
		}
	}

	private Announcement findAnnouncement(Long announcementId) {
		Optional<Announcement> optionalAnnouncement = announcementRepository.findById(announcementId);
		if (optionalAnnouncement.isEmpty()) {
			throw new NotFoundException("No announcement found with id: " + announcementId);
		}
		return optionalAnnouncement.get();
	}

	private void validateAdminForCompany(User admin, Company company) {
		if (!admin.getCompanies().contains(company)) {
			throw new NotAuthorizedException(admin.getCredentials().getUsername()
					+ " is not authorized to modify announcements for " + company.getName());
		}
		if (!admin.isAdmin() || !admin.getStatus().equals("JOINED")) {
			throw new NotAuthorizedException(
					"Insufficient permissions for user: " + admin.getCredentials().getUsername());
		}
	}

	private void addAnnouncementToRelations(Announcement announcement, Company company, User author) {
		if (company.getAnnouncements() == null) {
			company.setAnnouncements(new HashSet<>());
		}
		company.getAnnouncements().add(announcement);
		companyRepository.saveAndFlush(company);

		if (author.getAnnouncements() == null) {
			author.setAnnouncements(new HashSet<>());
		}
		author.getAnnouncements().add(announcement);
		userRepository.saveAndFlush(author);
	}

}
