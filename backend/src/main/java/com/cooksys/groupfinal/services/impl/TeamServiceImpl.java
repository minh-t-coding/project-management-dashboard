package com.cooksys.groupfinal.services.impl;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.cooksys.groupfinal.dtos.TeamDto;
import com.cooksys.groupfinal.dtos.TeamRequestDto;
import com.cooksys.groupfinal.entities.Company;
import com.cooksys.groupfinal.entities.Team;
import com.cooksys.groupfinal.entities.User;
import com.cooksys.groupfinal.exceptions.BadRequestException;
import com.cooksys.groupfinal.exceptions.NotFoundException;
import com.cooksys.groupfinal.mappers.TeamMapper;
import com.cooksys.groupfinal.repositories.CompanyRepository;
import com.cooksys.groupfinal.repositories.TeamRepository;
import com.cooksys.groupfinal.repositories.UserRepository;
import com.cooksys.groupfinal.services.TeamService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TeamServiceImpl implements TeamService {
	private final TeamRepository teamRepository;
	private final CompanyRepository companyRepository;
	private final UserRepository userRepository;

	private final TeamMapper teamMapper;

	@Override
	public TeamDto createTeam(Long companyId, TeamRequestDto request) {
		if (request == null || request.getName() == null || request.getDescription() == null
				|| request.getTeammateIds() == null) {
			throw new BadRequestException("Missing required parameters in creation request.");
		}

		Company company = findCompany(companyId);

		Team team = new Team();
		team.setName(request.getName());
		team.setDescription(request.getDescription());
		team.setCompany(company);

		Set<User> teammates = resolveTeammates(request.getTeammateIds(), company);
		attachMembers(team, teammates);

		return teamMapper.entityToDto(teamRepository.saveAndFlush(team));
	}

	@Override
	public TeamDto updateTeam(Long companyId, Long teamId, TeamRequestDto request) {
		if (request == null) {
			throw new BadRequestException("A team update request is required.");
		}

		Team team = findTeam(teamId);
		if (!team.getCompany().getId().equals(companyId)) {
			throw new BadRequestException("The requested team does not belong to the provided company.");
		}

		if (request.getName() != null) {
			team.setName(request.getName());
		}
		if (request.getDescription() != null) {
			team.setDescription(request.getDescription());
		}
		if (request.getTeammateIds() != null) {
			Set<User> teammates = resolveTeammates(request.getTeammateIds(), team.getCompany());
			replaceMembers(team, teammates);
		}

		return teamMapper.entityToDto(teamRepository.saveAndFlush(team));
	}

	@Override
	public void deleteTeam(Long companyId, Long teamId) {
		Team team = findTeam(teamId);
		if (!team.getCompany().getId().equals(companyId)) {
			throw new BadRequestException("The requested team does not belong to the provided company.");
		}
		clearMembers(team);
		teamRepository.delete(team);
	}

	private Company findCompany(Long companyId) {
		Optional<Company> optionalCompany = companyRepository.findById(companyId);
		if (optionalCompany.isEmpty()) {
			throw new NotFoundException("No company found with id: " + companyId);
		}
		return optionalCompany.get();
	}

	private Team findTeam(Long teamId) {
		Optional<Team> optionalTeam = teamRepository.findById(teamId);
		if (optionalTeam.isEmpty()) {
			throw new NotFoundException("No team found with id: " + teamId);
		}
		return optionalTeam.get();
	}

	private Set<User> resolveTeammates(Set<Long> teammateIds, Company company) {
		Set<User> teammates = new HashSet<>();
		if (teammateIds == null || teammateIds.isEmpty()) {
			return teammates;
		}

		List<User> users = userRepository.findByIdInAndActiveTrue(teammateIds);
		if (users.size() != teammateIds.size()) {
			throw new BadRequestException("One or more teammate IDs are invalid or inactive.");
		}

		for (User user : users) {
			if (!user.getCompanies().contains(company)) {
				throw new BadRequestException("User with id " + user.getId() + " is not assigned to this company.");
			}
			teammates.add(user);
		}
		return teammates;
	}

	private void attachMembers(Team team, Set<User> members) {
		for (User user : members) {
			user.getTeams().add(team);
			userRepository.saveAndFlush(user);
		}
		team.setTeammates(members);
	}

	private void replaceMembers(Team team, Set<User> newMembers) {
		clearMembers(team);
		attachMembers(team, newMembers);
	}

	private void clearMembers(Team team) {
		Set<User> existingMembers = new HashSet<>(team.getTeammates());
		for (User user : existingMembers) {
			user.getTeams().remove(team);
			userRepository.saveAndFlush(user);
		}
		team.getTeammates().clear();
	}

}
