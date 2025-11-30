package com.cooksys.groupfinal.services.impl;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.cooksys.groupfinal.dtos.CredentialsDto;
import com.cooksys.groupfinal.dtos.FullUserDto;
import com.cooksys.groupfinal.dtos.ProfileDto;
import com.cooksys.groupfinal.dtos.UserRequestDto;
import com.cooksys.groupfinal.dtos.UserUpdateRequestDto;
import com.cooksys.groupfinal.entities.Company;
import com.cooksys.groupfinal.entities.Credentials;
import com.cooksys.groupfinal.entities.Profile;
import com.cooksys.groupfinal.entities.User;
import com.cooksys.groupfinal.exceptions.BadRequestException;
import com.cooksys.groupfinal.exceptions.NotAuthorizedException;
import com.cooksys.groupfinal.exceptions.NotFoundException;
import com.cooksys.groupfinal.mappers.CredentialsMapper;
import com.cooksys.groupfinal.mappers.FullUserMapper;
import com.cooksys.groupfinal.repositories.CompanyRepository;
import com.cooksys.groupfinal.repositories.TeamRepository;
import com.cooksys.groupfinal.repositories.UserRepository;
import com.cooksys.groupfinal.services.UserService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

	private final UserRepository userRepository;
	private final CompanyRepository companyRepository;
	private final TeamRepository teamRepository;

	private final FullUserMapper fullUserMapper;
	private final CredentialsMapper credentialsMapper;

	private User findActiveUser(String username) {
		Optional<User> user = userRepository.findByCredentialsUsernameAndActiveTrue(username);
		if (user.isEmpty()) {
			throw new NotFoundException("The credentials provided do not belong to an active user.");
		}
		return user.get();
	}

	private User findUserById(Long id) {
		Optional<User> user = userRepository.findById(id);
		if (user.isEmpty()) {
			throw new NotFoundException("No user found with id: " + id);
		}
		return user.get();
	}

	@Override
	public FullUserDto login(CredentialsDto credentialsDto) {
		if (credentialsDto == null || credentialsDto.getUsername() == null || credentialsDto.getPassword() == null) {
			throw new BadRequestException("A username and password are required.");
		}
		User userToValidate = findActiveUser(credentialsDto.getUsername());
		Credentials credentialsToValidate = credentialsMapper.dtoToEntity(credentialsDto);
		if (!userToValidate.getCredentials().getPassword().equals(credentialsToValidate.getPassword())) {
			throw new NotAuthorizedException("The provided credentials are invalid.");
		}
		if (userToValidate.getStatus().equals("PENDING")) {
			userToValidate.setStatus("JOINED");
			userRepository.saveAndFlush(userToValidate);
		}
		return fullUserMapper.entityToFullUserDto(userToValidate);
	}

	@Override
	public FullUserDto addUser(Long companyId, UserRequestDto request) {
		// Validate request
		if (request == null || request.getProfile() == null || request.getCredentials() == null
				|| request.getCredentials().getUsername() == null || request.getCredentials().getPassword() == null
				|| request.getProfile().getEmail() == null) {
			throw new BadRequestException("Missing required parameters in creation request.");
		}

		Optional<Company> optionalCompany = companyRepository.findById(companyId);
		if (optionalCompany.isEmpty()) {
			throw new NotFoundException("No company found with id: " + companyId);
		}
		Company company = optionalCompany.get();

		User user;
		Optional<User> optionalUser = userRepository.findByCredentialsUsername(request.getCredentials().getUsername());
		if (optionalUser.isEmpty()) {
			user = new User();

			Credentials credentials = new Credentials();
			credentials.setUsername(request.getCredentials().getUsername());
			credentials.setPassword(request.getCredentials().getPassword());
			user.setCredentials(credentials);

			Profile profile = new Profile();
			profile.setEmail(request.getProfile().getEmail());
			profile.setLastName(request.getProfile().getLastName());
			profile.setFirstName(request.getProfile().getFirstName());
			profile.setPhone(request.getProfile().getPhone());
			user.setProfile(profile);

			user.setActive(true);
			user.setAdmin(request.isAdmin());
			user.setStatus("PENDING");
		} else {
			user = optionalUser.get();
		}

		user.getCompanies().add(company);
		user = userRepository.saveAndFlush(user);

		// save user to company
		company.getEmployees().add(user);
		companyRepository.saveAndFlush(company);

		return fullUserMapper.entityToFullUserDto(user);

	}

	@Override
	public FullUserDto updateUser(Long id, UserUpdateRequestDto request) {
		if (request == null || (request.getProfile() == null && request.getCredentials() == null)) {
			throw new BadRequestException("A profile or credential update must be provided.");
		}

		User userToUpdate = findUserById(id);

		if (request.getProfile() != null) {
			applyProfileUpdates(userToUpdate, request.getProfile());
		}

		if (request.getCredentials() != null) {
			applyCredentialUpdates(userToUpdate, request.getCredentials());
		}

		return fullUserMapper.entityToFullUserDto(userRepository.saveAndFlush(userToUpdate));
	}

	@Override
	public void deleteUser(Long id) {
		User user = findUserById(id);
		user.setActive(false);
		userRepository.saveAndFlush(user);
	}
	
	@Override
	public void deleteUserPermanent(Long id) {
		User user = findUserById(id);
		
		// detach from teams
		if (user.getTeams() != null && !user.getTeams().isEmpty()) {
			user.getTeams().forEach(team -> team.getTeammates().remove(user));
			teamRepository.saveAll(user.getTeams());
		}
		
		// detach from companies
		if (user.getCompanies() != null && !user.getCompanies().isEmpty()) {
			user.getCompanies().forEach(company -> company.getEmployees().remove(user));
			companyRepository.saveAll(user.getCompanies());
		}
		
		userRepository.delete(user);
	}

	@Override
	public FullUserDto reinstateUser(Long userId, CredentialsDto request) {
		User requester = getUserFromCredentials(request);
		validateAdminForCompany(requester);

		User userToReinstate = findUserById(userId);
		userToReinstate.setActive(true);

		return fullUserMapper.entityToFullUserDto(userRepository.saveAndFlush(userToReinstate));
	}

	private void applyProfileUpdates(User user, ProfileDto profileDto) {
		Profile profile = user.getProfile();
		if (profile == null) {
			profile = new Profile();
		}
		if (profileDto.getFirstName() != null) {
			profile.setFirstName(profileDto.getFirstName());
		}
		if (profileDto.getLastName() != null) {
			profile.setLastName(profileDto.getLastName());
		}
		if (profileDto.getEmail() != null) {
			profile.setEmail(profileDto.getEmail());
		}
		if (profileDto.getPhone() != null) {
			profile.setPhone(profileDto.getPhone());
		}
		user.setProfile(profile);
	}

	private void applyCredentialUpdates(User user, CredentialsDto credentialsDto) {
		Credentials credentials = user.getCredentials();
		if (credentials == null) {
			credentials = new Credentials();
		}
		if (credentialsDto.getUsername() != null) {
			credentials.setUsername(credentialsDto.getUsername());
		}
		if (credentialsDto.getPassword() != null) {
			credentials.setPassword(credentialsDto.getPassword());
		}
		user.setCredentials(credentials);
	}

	private User getUserFromCredentials(CredentialsDto credentialsDto) {
		if (credentialsDto.getPassword() == null || credentialsDto.getUsername() == null) {
			throw new BadRequestException("Username and password are required");
		}
		String username = credentialsDto.getUsername();
		Optional<User> optionalUser = userRepository.findByCredentialsUsernameAndActiveTrue(username);
		if (optionalUser.isEmpty()) {
			throw new NotFoundException("No active users found with the provided credentials.");
		}
		User user = optionalUser.get();
		if (!user.getCredentials().getPassword().equals(credentialsDto.getPassword())) {
			throw new NotAuthorizedException("Invalid credentials for user: " + username);
		}
		return user;
	}

	private void validateAdminForCompany(User admin) {
		if (!admin.isAdmin() || !admin.getStatus().equals("JOINED")) {
			throw new NotAuthorizedException(
					"Insufficient permissions for user: " + admin.getCredentials().getUsername());
		}
	}

}
