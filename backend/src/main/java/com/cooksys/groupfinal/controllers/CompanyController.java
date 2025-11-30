package com.cooksys.groupfinal.controllers;

import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.cooksys.groupfinal.dtos.AnnouncementDto;
import com.cooksys.groupfinal.dtos.AnnouncementRequestDto;
import com.cooksys.groupfinal.dtos.FullUserDto;
import com.cooksys.groupfinal.dtos.ProjectDto;
import com.cooksys.groupfinal.dtos.TeamDto;
import com.cooksys.groupfinal.dtos.TeamRequestDto;
import com.cooksys.groupfinal.dtos.UserRequestDto;
import com.cooksys.groupfinal.services.AnnouncementService;
import com.cooksys.groupfinal.services.CompanyService;
import com.cooksys.groupfinal.services.TeamService;
import com.cooksys.groupfinal.services.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/company")
@RequiredArgsConstructor
public class CompanyController {

	private final CompanyService companyService;
	private final AnnouncementService announcementService;
	private final TeamService teamService;
	private final UserService userService;

	@GetMapping("/{companyId}/users")
	public Set<FullUserDto> getAllUsers(@PathVariable Long companyId) {
		return companyService.getAllUsers(companyId);
	}

	@PostMapping("/{companyId}/user")
	@ResponseStatus(HttpStatus.CREATED)
	public FullUserDto addUser(@PathVariable Long companyId, @RequestBody UserRequestDto request) {
		return userService.addUser(companyId, request);
	}

	@GetMapping("/{companyId}/announcements")
	public Set<AnnouncementDto> getAllAnnouncements(@PathVariable Long companyId) {
		return companyService.getAllAnnouncements(companyId);
	}

	@PostMapping("/{companyId}/announcements")
	@ResponseStatus(HttpStatus.CREATED)
	public AnnouncementDto createAnnouncement(@PathVariable Long companyId,
			@RequestBody AnnouncementRequestDto request) {
		return announcementService.createAnnouncement(companyId, request);
	}

	@GetMapping("/{companyId}/teams")
	public Set<TeamDto> getAllTeams(@PathVariable Long companyId) {
		return companyService.getAllTeams(companyId);
	}

	@PostMapping("/{companyId}/teams")
	@ResponseStatus(HttpStatus.CREATED)
	public TeamDto createTeam(@PathVariable Long companyId, @RequestBody TeamRequestDto request) {
		return teamService.createTeam(companyId, request);
	}

	@PatchMapping("/{companyId}/teams/{teamId}")
	public TeamDto updateTeam(@PathVariable Long companyId, @PathVariable Long teamId,
			@RequestBody TeamRequestDto request) {
		return teamService.updateTeam(companyId, teamId, request);
	}

	@DeleteMapping("/{companyId}/teams/{teamId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteTeam(@PathVariable Long companyId, @PathVariable Long teamId) {
		teamService.deleteTeam(companyId, teamId);
	}

	@GetMapping("/{companyId}/teams/{teamId}/projects")
	public Set<ProjectDto> getAllProjects(@PathVariable Long companyId, @PathVariable Long teamId) {
		return companyService.getAllProjects(companyId, teamId);
	}

}
